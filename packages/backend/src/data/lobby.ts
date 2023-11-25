import { database } from "./database";
import { lobbyIdAdjectives, lobbyIdNouns } from "./kitchen_words";
import { LobbyDBO } from "./model";
import { randomBytes } from "crypto";

const randomInteger = () => randomBytes(2).readUInt16LE();

const generateAdjective = () => {
    return lobbyIdAdjectives[randomInteger() % lobbyIdAdjectives.length];
};
const generateNoun = () => {
    return lobbyIdNouns[randomInteger() % lobbyIdNouns.length];
};

const generateId = () => {
    return `${generateAdjective()}${generateAdjective()}${generateNoun()}`;
};

function getNextLobbyId()
{
    let nextId: string;
    do
    {
        nextId = generateId();
    } while(doesLobbyExistWithId(nextId));

    return nextId;
}

function doesLobbyExistWithId(id: string)
{
    const statement = database.prepare("SELECT EXISTS(SELECT 1 FROM lobbies WHERE id = ?)").pluck();
    return statement.get(id) === 1;
}

export function createLobby(): string
{
    const id = getNextLobbyId();
    const statement = database.prepare<LobbyDBO>("INSERT INTO lobbies VALUES (@id, @display_name)");
    statement.run({ id, display_name: null });
    return id;
}

export function getLobbyFromDatabaseById(id: string)
{
    const statement = database.prepare<string>("SELECT * FROM lobbies WHERE id = ? LIMIT 1");
    return statement.get(id) as LobbyDBO;
}

