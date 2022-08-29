class UserFacingError extends Error {
    constructor(message) {
        super(message);
        this.name = "UserFacingError";
    }
}

function serializeError (error) {
    if (typeof error === 'string') {
        return {
            type: 'error',
            message: error,
            isUserFacing: true
        }
    }

    return {
        type: 'error',
        message: error.message || error,
        stack: error.stack,
        isUserFacing: error.name === 'UserFacingError'
    }
}