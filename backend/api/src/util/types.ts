// Lobby types
export type CreateLobbyRequest = {
    lobbyName: string,
    userId: string
}

export type LobbyUserInfo = {
    userId: string,
    userName: string,
    points: number,
    role: string,
    joinDate: string,
    gamesParticipated: number
}

// User Types