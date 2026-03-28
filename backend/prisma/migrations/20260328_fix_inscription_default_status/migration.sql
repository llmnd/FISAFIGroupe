-- Update existing inscriptions with confirme status to liste_attente
UPDATE "InscriptionFormation" SET status = 'liste_attente' WHERE status = 'confirme';
