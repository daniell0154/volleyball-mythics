const candidates = ["coffee_break", "butter_fingers", "my_ball"];

function createAbilityReview(db, app, runtime, createBallContactState) {
  const drills = new Map();
  const slotOf = athlete => athlete.team + (athlete.slot + 1);

  async function setAvailability(id, enabled) {
    if (!candidates.includes(id) || typeof enabled !== "boolean") throw Error("invalid review ability");
    await db.exec("reset role");
    try {
      await db.query("update roster_abilities set enabled=$2 where id=$1", [id, enabled]);
    } finally {
      await db.exec("set role authenticated");
    }
    return { id, enabled };
  }

  function matchFor(code) {
    const room = app.rooms.all().find(entry => entry.code === code);
    const match = room && runtime.get(room.roomId);
    if (!match) throw Error("review match not found");
    return match;
  }

  function state(code) {
    const match = matchFor(code);
    return {
      tick: match.tick, phase: match.state.phase, score: match.state.score,
      athletes: Object.fromEntries(match.athletes.map(actor => [slotOf(actor), {
        ability: actor.ability?.id,
        position: actor.position,
        speed: actor.attributes.speed,
        receive: actor.attributes.receive,
        effect: match.activeEffects.get(actor.id) ?? null,
        cooldownUntil: match.abilityCooldowns.get(actor.id) ?? null,
      }])),
      lastAction: match.visualActions.at(-1)?.kind,
    };
  }

  function placeBall({ room, slot, distance, mode }) {
    const match = matchFor(room);
    if (match.state.phase !== "rally") throw Error("review drill requires a live rally");
    if (mode === "hold") {
      drills.set(match.room.roomId, { match, position: { x: 0, y: 4, z: 1 } });
      return { mode };
    }
    const target = match.athletes.find(actor => slotOf(actor) === slot);
    if (mode !== "probe" || !target || ![0, 2.1, 2.35].includes(distance)) throw Error("invalid review drill");
    const opponent = match.athletes.find(actor => actor.team !== target.team);
    match.touching.clear();
    match.contacts = { ...createBallContactState(match.room.mode), lastTouchSide: opponent.team, lastPlayerId: opponent.id };
    const player = target.position;
    const position = { x: player.x, y: player.y + 1.1, z: player.z + (target.team === "A" ? distance : -distance) };
    drills.set(match.room.roomId, { match, position, receiver: target.id });
    return { mode, distance };
  }

  function beforeAdvance() {
    for (const [roomId, drill] of drills) {
      if (drill.match.state.phase !== "rally") { drills.delete(roomId); continue; }
      drill.match.ball = { position: drill.position, velocity: { x: 0, y: 0, z: 0 }, grounded: false };
    }
  }

  function onAction(id, message) {
    if (message !== "Recepção!" && message !== "Chegue mais perto da bola." && !message.startsWith("Foi sem querer")) return;
    for (const [roomId, drill] of drills) {
      if (drill.receiver === id) drills.delete(roomId);
    }
  }

  return { setAvailability, state, placeBall, beforeAdvance, onAction };
}

module.exports = { candidates, createAbilityReview };
