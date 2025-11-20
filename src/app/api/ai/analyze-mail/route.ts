import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createServerClient } from "@/lib/supabase/server";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();

    // Check authentication
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 });
    }

    const { patientId, mailContent } = await request.json();

    if (!patientId || !mailContent) {
      return NextResponse.json(
        { error: "ID patient et contenu du mail requis" },
        { status: 400 }
      );
    }

    // Analyze mail with Claude
    const message = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: `Tu es un assistant medical. Analyse ce mail et extrait les informations pertinentes.

Contenu du mail:
${mailContent}

Extrait et structure les informations suivantes (en francais):
1. Informations medicales cles (diagnostics, resultats, traitements)
2. Points importants a retenir
3. Actions a entreprendre (si mentionnees)

Format ta reponse de maniere concise et professionnelle.`,
        },
      ],
    });

    const analysis =
      message.content[0].type === "text" ? message.content[0].text : "";

    // Save mail import
    await supabase.from("mail_imports").insert({
      user_id: session.user.id,
      patient_id: patientId,
      contenu_original: mailContent,
      analyse_ia: analysis,
    });

    return NextResponse.json({ analysis });
  } catch (error) {
    console.error("Error analyzing mail:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'analyse du mail" },
      { status: 500 }
    );
  }
}
