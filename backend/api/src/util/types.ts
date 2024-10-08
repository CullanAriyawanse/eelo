// Lobby types
export type CreateLobbyRequest = {
    lobbyName: string,
    userId: string
}

export type LobbyUserInfo = {
    userId: string,
    username: string,
    points: number,
    role: string,
    joinDate: string,
    gamesParticipated: number
}

// User Types
export type UserInfo = {
    userId: string, 
    username: string,
    lobbies: string[],
    lobbyInvites: string[],
    friends: string[]
}

export type CreateUserRequest = {
    userId: string,
    username: string
}