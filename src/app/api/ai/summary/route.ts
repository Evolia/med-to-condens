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

    const { patientId } = await request.json();

    if (!patientId) {
      return NextResponse.json(
        { error: "ID patient requis" },
        { status: 400 }
      );
    }

    // Get patient data
    const { data: patient, error: patientError } = await supabase
      .from("patients")
      .select("nom, prenom, date_naissance, notes")
      .eq("id", patientId)
      .single();

    if (patientError || !patient) {
      return NextResponse.json(
        { error: "Patient non trouve" },
        { status: 404 }
      );
    }

    // Get patient observations
    const { data: observations, error: obsError } = await supabase
      .from("observations")
      .select("date, type_observation, contenu")
      .eq("patient_id", patientId)
      .order("date", { ascending: false })
      .limit(50);

    if (obsError) {
      return NextResponse.json(
        { error: "Erreur lors de la recuperation des observations" },
        { status: 500 }
      );
    }

    if (!observations || observations.length === 0) {
      return NextResponse.json(
        { error: "Aucune observation pour generer un resume" },
        { status: 400 }
      );
    }

    // Format observations for the prompt
    const observationsText = observations
      .map(
        (obs) =>
          `[${obs.date}] ${obs.type_observation}: ${obs.contenu || "Pas de contenu"}`
      )
      .join("\n");

    // Generate summary with Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `Tu es un assistant medical. Resume en 3-5 points cles les observations suivantes pour cet enfant.
Focus sur: diagnostics, traitements en cours, points de vigilance, evolution.
Sois concis et utilise un langage medical professionnel.

Patient: ${patient.nom} ${patient.prenom}
${patient.date_naissance ? `Date de naissance: ${patient.date_naissance}` : ""}
${patient.notes ? `Notes: ${patient.notes}` : ""}

Observations:
${observationsText}

Resume (en francais):`;

    const result = await model.generateContent(prompt);
    const summary = result.response.text();

    // Save summary to patient record
    await supabase
      .from("patients")
      .update({
        resume_ia: summary,
        resume_updated_at: new Date().toISOString(),
      })
      .eq("id", patientId);

    return NextResponse.json({ summary });
  } catch (error) {
    console.error("Error generating summary:", error);
    return NextResponse.json(
      { error: "Erreur lors de la generation du resume" },
      { status: 500 }
    );
  }
}
