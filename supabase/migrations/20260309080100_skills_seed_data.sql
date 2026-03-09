-- Seed: OFPPT-aligned skill categories and skills
-- These are inserted for any company that has no categories yet.
-- Uses a function so it runs per-company on first taxonomy access.

CREATE OR REPLACE FUNCTION public.seed_default_skills(p_company_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_cat_id uuid;
BEGIN
  -- Only seed if company has no categories
  IF EXISTS (SELECT 1 FROM public.skill_categories WHERE company_id = p_company_id) THEN
    RETURN;
  END IF;

  -- 1. Digital & IT Skills (NTIC)
  INSERT INTO public.skill_categories (company_id, name_fr, name_en, ofppt_sector_code, sort_order)
  VALUES (p_company_id, 'Compétences numériques', 'Digital & IT Skills', 'NTIC', 1)
  RETURNING id INTO v_cat_id;

  INSERT INTO public.skills (company_id, category_id, name_fr, name_en, description) VALUES
    (p_company_id, v_cat_id, 'Suite bureautique', 'Office Suite', 'Word, Excel, PowerPoint'),
    (p_company_id, v_cat_id, 'Gestion de bases de données', 'Database Management', 'SQL, Access, data modeling'),
    (p_company_id, v_cat_id, 'Développement web', 'Web Development', 'HTML, CSS, JavaScript, frameworks'),
    (p_company_id, v_cat_id, 'Administration réseau', 'Network Administration', 'LAN/WAN, TCP/IP, security'),
    (p_company_id, v_cat_id, 'Cybersécurité', 'Cybersecurity', 'Threat analysis, firewalls, compliance'),
    (p_company_id, v_cat_id, 'Cloud computing', 'Cloud Computing', 'AWS, Azure, GCP basics'),
    (p_company_id, v_cat_id, 'ERP / Progiciels', 'ERP Systems', 'SAP, Oracle, Sage integration'),
    (p_company_id, v_cat_id, 'Analyse de données', 'Data Analysis', 'Excel avancé, Power BI, tableaux de bord'),
    (p_company_id, v_cat_id, 'Intelligence artificielle', 'Artificial Intelligence', 'ML basics, prompt engineering, AI tools'),
    (p_company_id, v_cat_id, 'Support technique', 'Technical Support', 'Help desk, troubleshooting, documentation');

  -- 2. Management & Leadership (GRH)
  INSERT INTO public.skill_categories (company_id, name_fr, name_en, ofppt_sector_code, sort_order)
  VALUES (p_company_id, 'Management & Leadership', 'Management & Leadership', 'GRH', 2)
  RETURNING id INTO v_cat_id;

  INSERT INTO public.skills (company_id, category_id, name_fr, name_en, description) VALUES
    (p_company_id, v_cat_id, 'Gestion d''équipe', 'Team Management', 'Delegation, motivation, conflict resolution'),
    (p_company_id, v_cat_id, 'Gestion de projet', 'Project Management', 'Planning, Agile, Gantt, risk management'),
    (p_company_id, v_cat_id, 'Prise de décision', 'Decision Making', 'Analysis, strategic thinking, problem-solving'),
    (p_company_id, v_cat_id, 'Communication managériale', 'Managerial Communication', 'Feedback, presentations, stakeholder management'),
    (p_company_id, v_cat_id, 'Gestion du changement', 'Change Management', 'Transformation, adoption, resistance management'),
    (p_company_id, v_cat_id, 'Coaching & mentorat', 'Coaching & Mentoring', 'Employee development, career guidance'),
    (p_company_id, v_cat_id, 'Planification stratégique', 'Strategic Planning', 'Vision, OKRs, roadmapping'),
    (p_company_id, v_cat_id, 'Gestion budgétaire', 'Budget Management', 'Cost control, forecasting, ROI analysis'),
    (p_company_id, v_cat_id, 'Droit du travail marocain', 'Moroccan Labor Law', 'Code du travail, CNSS, CIMR, contrats'),
    (p_company_id, v_cat_id, 'Gestion de la performance', 'Performance Management', 'KPIs, evaluations, improvement plans');

  -- 3. Industrial & Technical (BTP / Industriel)
  INSERT INTO public.skill_categories (company_id, name_fr, name_en, ofppt_sector_code, sort_order)
  VALUES (p_company_id, 'Compétences industrielles', 'Industrial & Technical', 'BTP', 3)
  RETURNING id INTO v_cat_id;

  INSERT INTO public.skills (company_id, category_id, name_fr, name_en, description) VALUES
    (p_company_id, v_cat_id, 'Sécurité au travail', 'Workplace Safety', 'HSE, EPI, normes marocaines'),
    (p_company_id, v_cat_id, 'Maintenance industrielle', 'Industrial Maintenance', 'Preventive, corrective, predictive'),
    (p_company_id, v_cat_id, 'Contrôle qualité', 'Quality Control', 'ISO 9001, inspection, métrologie'),
    (p_company_id, v_cat_id, 'Lean manufacturing', 'Lean Manufacturing', '5S, Kaizen, value stream mapping'),
    (p_company_id, v_cat_id, 'Gestion des stocks', 'Inventory Management', 'FIFO, just-in-time, warehousing'),
    (p_company_id, v_cat_id, 'Lecture de plans techniques', 'Technical Drawing Reading', 'AutoCAD, blueprints, tolerances'),
    (p_company_id, v_cat_id, 'Électricité industrielle', 'Industrial Electricity', 'Circuits, automation, PLCs'),
    (p_company_id, v_cat_id, 'Mécanique générale', 'General Mechanics', 'Assembly, machining, hydraulics'),
    (p_company_id, v_cat_id, 'Gestion environnementale', 'Environmental Management', 'ISO 14001, waste management, sustainability'),
    (p_company_id, v_cat_id, 'Logistique & supply chain', 'Logistics & Supply Chain', 'Transport, procurement, optimization');

  -- 4. Commercial & Marketing (Commerce)
  INSERT INTO public.skill_categories (company_id, name_fr, name_en, ofppt_sector_code, sort_order)
  VALUES (p_company_id, 'Commercial & Marketing', 'Sales & Marketing', 'Commerce', 4)
  RETURNING id INTO v_cat_id;

  INSERT INTO public.skills (company_id, category_id, name_fr, name_en, description) VALUES
    (p_company_id, v_cat_id, 'Techniques de vente', 'Sales Techniques', 'Prospecting, negotiation, closing'),
    (p_company_id, v_cat_id, 'Marketing digital', 'Digital Marketing', 'SEO, social media, email campaigns'),
    (p_company_id, v_cat_id, 'Relation client', 'Customer Relations', 'CRM, satisfaction, loyalty programs'),
    (p_company_id, v_cat_id, 'Négociation commerciale', 'Business Negotiation', 'B2B, contracts, pricing strategy'),
    (p_company_id, v_cat_id, 'Étude de marché', 'Market Research', 'Analysis, competition, trends'),
    (p_company_id, v_cat_id, 'Communication d''entreprise', 'Corporate Communication', 'Branding, PR, internal comms'),
    (p_company_id, v_cat_id, 'Export & commerce international', 'International Trade', 'Incoterms, customs, forex'),
    (p_company_id, v_cat_id, 'E-commerce', 'E-Commerce', 'Online platforms, payment, fulfillment'),
    (p_company_id, v_cat_id, 'Service après-vente', 'After-Sales Service', 'Warranty, returns, support processes'),
    (p_company_id, v_cat_id, 'Analyse commerciale', 'Sales Analytics', 'Dashboards, forecasting, pipeline management');

  -- 5. Soft Skills & Transversal (Transversal)
  INSERT INTO public.skill_categories (company_id, name_fr, name_en, ofppt_sector_code, sort_order)
  VALUES (p_company_id, 'Compétences transversales', 'Soft Skills & Transversal', 'TRS', 5)
  RETURNING id INTO v_cat_id;

  INSERT INTO public.skills (company_id, category_id, name_fr, name_en, description) VALUES
    (p_company_id, v_cat_id, 'Communication orale', 'Oral Communication', 'Presentations, meetings, public speaking'),
    (p_company_id, v_cat_id, 'Communication écrite', 'Written Communication', 'Reports, emails, documentation'),
    (p_company_id, v_cat_id, 'Travail en équipe', 'Teamwork', 'Collaboration, conflict resolution, empathy'),
    (p_company_id, v_cat_id, 'Résolution de problèmes', 'Problem Solving', 'Root cause analysis, creative thinking'),
    (p_company_id, v_cat_id, 'Gestion du temps', 'Time Management', 'Prioritization, deadlines, productivity'),
    (p_company_id, v_cat_id, 'Adaptabilité', 'Adaptability', 'Flexibility, learning agility, resilience'),
    (p_company_id, v_cat_id, 'Langues - Français', 'Languages - French', 'Professional French proficiency'),
    (p_company_id, v_cat_id, 'Langues - Anglais', 'Languages - English', 'Professional English proficiency'),
    (p_company_id, v_cat_id, 'Langues - Arabe', 'Languages - Arabic', 'Professional Arabic (darija + standard)'),
    (p_company_id, v_cat_id, 'Pensée critique', 'Critical Thinking', 'Analysis, evaluation, logical reasoning');
END;
$$;
