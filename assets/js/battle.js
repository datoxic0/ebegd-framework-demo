import { state } from './state.js';
import { STATS } from './constants.js';
import { els, log, closeModal, updateStats } from './ui.js';
import { playAudio } from './audio.js';

export function startBattle(entity, openModalFn) {
    state.battle.active = true;
    state.battle.enemyHP = entity.data.hp || 20;

    // Open modal with battle context via callback or direct import (using callback for flexibility if needed, but here mostly for circular dep avoidance if openModal was in main)
    openModalFn(entity, 'battle');
    log("COMBAT STARTED. Enemy encountered.");
    els.formulaDisplay.textContent = `=INIT_BATTLE(Player_ATK, Enemy_DEF)`;
}

export function resolveBattleTurn(isCorrect) {
    // Variables
    const Player_ATK = STATS.PLAYER_ATK;
    const Enemy_DEF = STATS.ENEMY_DEF;
    const CRIT_Chance = Math.random(); 

    // Logic Core
    const BaseDamage = Math.max(0, Player_ATK - Enemy_DEF);
    const IsCritical = CRIT_Chance > 0.8;
    const CritMultiplier = IsCritical ? 2 : 1;

    let finalDamage = 0;

    if (!isCorrect) {
        finalDamage = 0;
        playAudio('wrong');
        els.modalFeedback.textContent = "MISS! (Wrong Answer)";
        els.modalFeedback.classList.add('error');
        log(`Battle Log: Missed. Q_Result=FALSE`);
    } else {
        finalDamage = BaseDamage * CritMultiplier;
        playAudio('correct');

        const critText = IsCritical ? " CRITICAL HIT!" : "";
        els.modalFeedback.textContent = `HIT! -${finalDamage} HP${critText}`;
        els.modalFeedback.classList.add('success');

        log(`Battle Log: Hit! Damage=${finalDamage} (Crit=${IsCritical})`);
    }

    // Display the formula in the bar for educational purposes
    els.formulaDisplay.textContent = `=LET(Dmg,${BaseDamage}, Crit,${IsCritical?"2":"1"}, RES,${isCorrect}, IF(RES, Dmg*Crit, 0)) -> ${finalDamage}`;

    // Apply Damage
    state.battle.enemyHP -= finalDamage;

    if (state.battle.enemyHP <= 0) {
        // Enemy Defeated
        setTimeout(() => {
            // Find entity in state array based on the interaction coords
            const { x, y } = state.currentInteraction;
            const liveEntity = state.entities.find(e => e.x === x && e.y === y);

            if (liveEntity) {
                liveEntity.el.style.display = 'none';
                state.entities.splice(state.entities.indexOf(liveEntity), 1);

                // Rewards
                state.score += 50;
                updateStats();
            }

            log("Enemy Defeated. Target eliminated.");
            closeModal();
            state.battle.active = false;
        }, 1000);
    } else {
        // Enemy Survived (Turn Over)
        if (!isCorrect) {
             // Shake input if wrong
             els.modalInput.classList.add('shake');
             setTimeout(() => els.modalInput.classList.remove('shake'), 300);
        } else {
            // Correct but enemy still alive
            setTimeout(() => {
                els.modalFeedback.textContent = `Enemy HP: ${state.battle.enemyHP}`;
                els.modalInput.value = ''; 
                closeModal(); 
            }, 1000);
        }
    }
}