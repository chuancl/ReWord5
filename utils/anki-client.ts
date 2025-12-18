
export interface AnkiResponse<T> {
    result: T;
    error: string | null;
}

export const invokeAnki = async <T>(action: string, params: any = {}, baseUrl: string = 'http://127.0.0.1:8765'): Promise<T> => {
    try {
        const response = await fetch(baseUrl, {
            method: 'POST',
            body: JSON.stringify({ action, version: 6, params }),
            headers: { 'Content-Type': 'application/json' }
        });
        const json: AnkiResponse<T> = await response.json();
        if (json.error) {
            throw new Error(String(json.error));
        }
        return json.result;
    } catch (e: any) {
        throw new Error(`Anki Connect Error: ${e.message}`);
    }
};

export const pingAnki = async (baseUrl: string): Promise<string> => {
    // 'version' action returns the API version number
    return invokeAnki<string>('version', {}, baseUrl);
};

export const getModelNames = async (baseUrl: string): Promise<string[]> => {
    return invokeAnki<string[]>('modelNames', {}, baseUrl);
};

export const getDeckNames = async (baseUrl: string): Promise<string[]> => {
    return invokeAnki<string[]>('deckNames', {}, baseUrl);
};

export const createDeck = async (deck: string, baseUrl: string) => {
    return invokeAnki<number>('createDeck', { deck }, baseUrl);
};

export const createModel = async (modelName: string, baseUrl: string) => {
    // Create a standard Basic model structure
    // Since our app generates full HTML in the fields, the template here can be minimal.
    return invokeAnki('createModel', {
        modelName,
        inOrderFields: ["Front", "Back"],
        css: `.card {
 font-family: arial;
 font-size: 20px;
 text-align: center;
 color: black;
 background-color: white;
}
/* Adjustments for ContextLingo generated content */
img { max-width: 100%; }
`,
        cardTemplates: [
            {
                Name: "Card 1",
                Front: "{{Front}}",
                Back: "{{FrontSide}}\n\n<hr id=answer>\n\n{{Back}}"
            }
        ]
    }, baseUrl);
};

export const canAddNotes = async (notes: any[], baseUrl: string) => {
    // Returns an array of booleans indicating if each note can be added (is not duplicate)
    return invokeAnki<boolean[]>('canAddNotes', { notes }, baseUrl);
};

export const addNotesToAnki = async (notes: any[], baseUrl: string) => {
    // 'addNotes' action takes an array of notes
    return invokeAnki<(number | null)[]>('addNotes', { notes }, baseUrl);
};

export const findNotesInDeck = async (deckName: string, baseUrl: string) => {
    // Find all notes in a specific deck
    return invokeAnki<number[]>('findNotes', { query: `deck:"${deckName}"` }, baseUrl);
};

export const getNotesInfo = async (noteIds: number[], baseUrl: string) => {
    return invokeAnki<any[]>('notesInfo', { notes: noteIds }, baseUrl);
};

export const getCardsInfo = async (query: string, baseUrl: string) => {
    // 1. Find cards matching query
    const cardIds = await invokeAnki<number[]>('findCards', { query }, baseUrl);
    if (cardIds.length === 0) return [];
    
    // 2. Get card details
    return invokeAnki<any[]>('cardsInfo', { cards: cardIds }, baseUrl);
};
