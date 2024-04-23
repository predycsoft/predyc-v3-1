addEventListener('message', ({ data }) => {
    // Received a message from the main thread
    const numberToLog = data;
    console.log(`Worker logged: ${numberToLog}`);
});