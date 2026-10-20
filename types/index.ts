export type WordType = 'Verb' | 'Noun' | 'Adjective' | 'Adverb' | 'Preposition' | 'Conjunction' | 'Other';
export interface Word { id:string; word:string; translation:string; type:WordType; forms:string; example:string; level:'A1'|'A2'|'B1'|'B2'; }
export interface Expression { id:string; phrase:string; meaning:string; usage:string; example:string; category:'daily'|'movie'|'idiom'|'phrasal'; }
export interface SentenceStructure { id:string; name:string; pattern:string; level:'A1'|'A2'|'B1'|'B2'; example:string; explanation:string; }
export interface Story { id:string; title:string; level:'A1'|'A2'|'B1'|'B2'; content:string; translation:string; keyStructures:string[]; }
