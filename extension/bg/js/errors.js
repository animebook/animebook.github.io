class UserFacingError extends Error {
    constructor(message) {
        super(message);
        this.name = "UserFacingError";
    }
}

function serializeError (error) {
    return {
        'type': 'error',
        'message': error.message,
        'stack': error.stack,
        'isUserFacing': error.name === 'UserFacingError'
    }
}