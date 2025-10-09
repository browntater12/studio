import { config } from 'dotenv';
config();

import '@/ai/flows/generate-potential-actions.ts';
import '@/ai/flows/summarize-account-notes.ts';
import '@/ai/flows/dictate-note.ts';
