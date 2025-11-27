const sounds = {
    move: new Audio('sfx_move.mp3'),
    correct: new Audio('sfx_correct.mp3'),
    wrong: new Audio('sfx_wrong.mp3')
};

export function initAudio() {
    Object.values(sounds).forEach(s => s.load());
}

export function playAudio(key) {
    const sound = sounds[key];
    if (sound) {
        sound.currentTime = 0;
        sound.play().catch(() => {});
    }
}

