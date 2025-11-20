import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createServerClient } from "@/lib/supabase/server";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || "");

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

    // Analyze mail with Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `Tu es un assistant medical. Analyse ce mail et extrait les informations pertinentes.

Contenu du mail:
${mailContent}

Extrait et structure les informations suivantes (en francais):
1. Informations medicales cles (diagnostics, resultats, traitements)
2. Points importants a retenir
3. Actions a entreprendre (si mentionnees)

Format ta reponse de maniere concise et professionnelle.`;

    const result = await model.generateContent(prompt);
    const analysis = result.response.text();

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
