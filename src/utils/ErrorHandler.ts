export async function processRejection(reason, promise) {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
}

export async function processException(error) {
    console.error('Uncaught Exception:', error);
}