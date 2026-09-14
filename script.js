const canvas = document.querySelector('canvas');
const canvasContext = canvas.getContext('2d');
const GAME_WIDTH = 64 * 16
canvas.width = GAME_WIDTH
const GAME_HEIGHT = 64 * 9
canvas.height = GAME_HEIGHT
let level = 1;
const GRAVITY = 0.11;
const JUMP_FORCE = -4;
const MOVEMENT_SPEED = 1;
const BACKGROUND_SCALE = 2.4;
const ANIMATION_SPEED = 25;
const TILE_DIM = 16;
const ENEMY_VERTICAL_RANGE = 30;
const KEYS = {
    a: {
        pressed: false
    },
    d: {
        pressed: false
    },
    w: {
        pressed: false
    }
}
const scaledCanvas = {
    width: canvas.width / BACKGROUND_SCALE,
    height: canvas.height / BACKGROUND_SCALE
}
