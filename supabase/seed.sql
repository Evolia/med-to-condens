-- Seed data for MedCondens
-- Run this in the Supabase SQL Editor to create sample patients and observations

-- Note: Replace 'YOUR_USER_ID' with your actual user_id from auth.users table
-- You can find your user_id by running: SELECT id FROM auth.users LIMIT 1;

DO $$
DECLARE
    v_user_id UUID;
    v_patient_1 UUID;
    v_patient_2 UUID;
    v_patient_3 UUID;
    v_patient_4 UUID;
    v_patient_5 UUID;
    v_patient_6 UUID;
    v_consultation_1 UUID;
    v_consultation_2 UUID;
BEGIN
    -- Get the first user from the database
    SELECT id INTO v_user_id FROM auth.users LIMIT 1;

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'No user found. Please log in first to create your user account.';
    END IF;

    -- Create patients
    INSERT INTO patients (id, user_id, nom, prenom, date_naissance, telephone, email, adresse, secteur, notes)
    VALUES
        (gen_random_uuid(), v_user_id, 'Dupont', 'Emma', '2020-03-15', '06 12 34 56 78', 'parents.dupont@email.com', '12 rue des Lilas, 75020 Paris', 'Paris 20', 'Allergie penicilline. Suivi regulier pour asthme leger.')
    RETURNING id INTO v_patient_1;

    INSERT INTO patients (id, user_id, nom, prenom, date_naissance, telephone, email, adresse, secteur, notes)
    VALUES
        (gen_random_uuid(), v_user_id, 'Martin', 'Lucas', '2019-07-22', '06 98 76 54 32', 'famille.martin@email.com', '45 avenue Victor Hugo, 75016 Paris', 'Paris 16', 'Premature 34 SA. Suivi developpemental en cours.')
    RETURNING id INTO v_patient_2;

    INSERT INTO patients (id, user_id, nom, prenom, date_naissance, telephone, email, adresse, secteur, notes)
    VALUES
        (gen_random_uuid(), v_user_id, 'Lefevre', 'Chloe', '2022-11-08', '07 11 22 33 44', 'lefevre.contact@email.com', '8 place de la Republique, 75011 Paris', 'Paris 11', 'RAS - Suivi standard')
    RETURNING id INTO v_patient_3;

    INSERT INTO patients (id, user_id, nom, prenom, date_naissance, telephone, email, adresse, secteur, notes)
    VALUES
        (gen_random_uuid(), v_user_id, 'Moreau', 'Thomas', '2021-01-30', '06 55 44 33 22', 'moreau.parents@email.com', '23 boulevard Voltaire, 75011 Paris', 'Paris 11', 'Eczema atopique modere. Traitement emollient en cours.')
    RETURNING id INTO v_patient_4;

    INSERT INTO patients (id, user_id, nom, prenom, date_naissance, telephone, email, adresse, secteur, notes)
    VALUES
        (gen_random_uuid(), v_user_id, 'Bernard', 'Lea', '2018-05-12', '06 77 88 99 00', 'bernard.lea@email.com', '56 rue du Faubourg Saint-Antoine, 75012 Paris', 'Paris 12', 'TDAH diagnostique. Suivi neuropediatre Dr. Petit.')
    RETURNING id INTO v_patient_5;

    INSERT INTO patients (id, user_id, nom, prenom, date_naissance, telephone, email, adresse, secteur, notes)
    VALUES
        (gen_random_uuid(), v_user_id, 'Petit', 'Nathan', '2023-09-05', '06 33 22 11 00', 'petit.famille@email.com', '7 rue de la Roquette, 75011 Paris', 'Paris 11', 'Nouveau patient. Premier enfant.')
    RETURNING id INTO v_patient_6;

    -- Create consultations
    INSERT INTO consultations (id, user_id, date, titre, type)
    VALUES
        (gen_random_uuid(), v_user_id, CURRENT_DATE - INTERVAL '7 days', 'Consultation du lundi', 'consultation')
    RETURNING id INTO v_consultation_1;

    INSERT INTO consultations (id, user_id, date, titre, type)
    VALUES
        (gen_random_uuid(), v_user_id, CURRENT_DATE, 'Consultations du jour', 'consultation')
    RETURNING id INTO v_consultation_2;

    -- Create observations for patients

    -- Emma Dupont - Multiple observations
    INSERT INTO observations (user_id, patient_id, consultation_id, date, type_observation, contenu, age_patient_jours)
    VALUES
        (v_user_id, v_patient_1, v_consultation_1, CURRENT_DATE - INTERVAL '7 days', 'consultation',
         'Consultation de suivi asthme. Pas de crise depuis 3 mois. Ventoline utilisee 1x/semaine maximum. Poursuite traitement de fond. RDV dans 3 mois.',
         ((CURRENT_DATE - INTERVAL '7 days')::date - '2020-03-15'::date)),
        (v_user_id, v_patient_1, NULL, CURRENT_DATE - INTERVAL '30 days', 'telephone',
         'Appel maman: toux nocturne depuis 3 jours. Conseils majoration Ventoline. Rappeler si persistance > 5j.',
         ((CURRENT_DATE - INTERVAL '30 days')::date - '2020-03-15'::date)),
        (v_user_id, v_patient_1, NULL, CURRENT_DATE - INTERVAL '90 days', 'resultats',
         'IgE specifiques: acariens positifs (classe 3). Chat negatif. Conseil eviction acariens.',
         ((CURRENT_DATE - INTERVAL '90 days')::date - '2020-03-15'::date));

    -- Lucas Martin - Developmental follow-up
    INSERT INTO observations (user_id, patient_id, consultation_id, date, type_observation, contenu, age_patient_jours)
    VALUES
        (v_user_id, v_patient_2, v_consultation_2, CURRENT_DATE, 'consultation',
         'Consultation 5 ans. Developpement psychomoteur normal rattrape. Langage OK. Bon comportement social. Vaccins a jour. Prochain bilan a 6 ans.',
         (CURRENT_DATE - '2019-07-22'::date)),
        (v_user_id, v_patient_2, NULL, CURRENT_DATE - INTERVAL '60 days', 'courrier',
         'Courrier orthophoniste: progres significatifs en articulation. Propose arret seances dans 3 mois si evolution favorable.',
         ((CURRENT_DATE - INTERVAL '60 days')::date - '2019-07-22'::date));

    -- Chloe Lefevre - Standard follow-up
    INSERT INTO observations (user_id, patient_id, consultation_id, date, type_observation, contenu, age_patient_jours)
    VALUES
        (v_user_id, v_patient_3, v_consultation_2, CURRENT_DATE, 'consultation',
         'Visite des 2 ans. Croissance +2DS. Developpement normal. Vaccins ROR et DTP rappel faits. RAS. Prochain RDV 3 ans.',
         (CURRENT_DATE - '2022-11-08'::date));

    -- Thomas Moreau - Eczema follow-up
    INSERT INTO observations (user_id, patient_id, consultation_id, date, type_observation, contenu, age_patient_jours)
    VALUES
        (v_user_id, v_patient_4, v_consultation_1, CURRENT_DATE - INTERVAL '7 days', 'consultation',
         'Poussee eczema coudes et genoux. Prescription dermocorticoides classe 2 x 7j puis decroissance. Rappel hydratation quotidienne. Controle J15.',
         ((CURRENT_DATE - INTERVAL '7 days')::date - '2021-01-30'::date)),
        (v_user_id, v_patient_4, NULL, CURRENT_DATE - INTERVAL '14 days', 'urgence',
         'Surinfection eczema bras droit. Prescription Fucidine + Augmentin 7j. Eviction collectivite 48h. Controle J7.',
         ((CURRENT_DATE - INTERVAL '14 days')::date - '2021-01-30'::date));

    -- Lea Bernard - ADHD follow-up
    INSERT INTO observations (user_id, patient_id, consultation_id, date, type_observation, contenu, age_patient_jours)
    VALUES
        (v_user_id, v_patient_5, NULL, CURRENT_DATE - INTERVAL '45 days', 'suivi',
         'Point trimestriel TDAH. Methylphenidate bien tolere. Parents notent amelioration concentration ecole. Pas effets secondaires. Poursuite traitement. Prochain RDV neuropediatre dans 2 mois.',
         ((CURRENT_DATE - INTERVAL '45 days')::date - '2018-05-12'::date)),
        (v_user_id, v_patient_5, NULL, CURRENT_DATE - INTERVAL '120 days', 'reunion',
         'Reunion equipe educative ecole. Amenagements scolaires en place: temps supplementaire, placement devant. Progres notes.',
         ((CURRENT_DATE - INTERVAL '120 days')::date - '2018-05-12'::date));

    -- Nathan Petit - New patient
    INSERT INTO observations (user_id, patient_id, consultation_id, date, type_observation, contenu, age_patient_jours)
    VALUES
        (v_user_id, v_patient_6, v_consultation_2, CURRENT_DATE, 'consultation',
         'Premiere consultation. Nourrisson 14 mois en bonne sante. Allaitement maternel exclusif jusqu a 6 mois puis diversification classique. Croissance P50. Developpement normal. Vaccins a jour selon calendrier.',
         (CURRENT_DATE - '2023-09-05'::date));

    -- Create some todos
    INSERT INTO todos (user_id, patient_id, contenu, date_echeance, urgence, type_todo)
    VALUES
        (v_user_id, v_patient_1, 'Rappel bilan allergo - Verifier resultats prick tests prevus', CURRENT_DATE + INTERVAL '14 days', 'normale', 'rappel'),
        (v_user_id, v_patient_4, 'Controle eczema J15 - Evaluer efficacite dermocorticoides', CURRENT_DATE + INTERVAL '8 days', 'haute', 'rdv'),
        (v_user_id, v_patient_5, 'Courrier ecole - Rediger certificat pour amenagements', CURRENT_DATE + INTERVAL '7 days', 'haute', 'courrier'),
        (v_user_id, v_patient_2, 'RDV bilan 6 ans - Programmer consultation bilan', CURRENT_DATE + INTERVAL '60 days', 'basse', 'rdv');

    RAISE NOTICE 'Seed data created successfully!';
    RAISE NOTICE 'Created 6 patients, 2 consultations, multiple observations, and 4 todos';
END $$;
