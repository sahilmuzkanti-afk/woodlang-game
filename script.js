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
class Sprite {
    constructor({position, imageSrc, scale=1, numFrames=1, animationSpeed = ANIMATION_SPEED}) {
        this.position = position;
        this.image=new Image();
        this.image.src = imageSrc
        this.loaded=false
        this.scale=scale
        this.numFrames = numFrames
        this.currentFrame = 0
        this.elapsedFrames = 0
        this.animationSpeed = animationSpeed
        this.image.onload = () => {
            this.loaded = true
            this.width= ( this.image.width/this.numFrames ) * this.scale
            this.height = (this.image.height ) * this.scale
        }
    }
}
Sprite.prototype.draw = function() {
    if (!this.loaded)
        return;
    else {
        canvasContext.drawImage(
            this.image,
            this.currentFrame * (this.image.width / this.numFrames),
            0,
            this.image.width / this.numFrames,
            this.image.height,
            this.position.x,
            this.position.y,
            this.width ,
            this.height
        )
    }
}
Sprite.prototype.update = function() {
    this.draw();
    this.animate();
}
Sprite.prototype.animate = function() {
    this.elapsedFrames++
    if(this.elapsedFrames % this.animationSpeed === 0 ) {
        if(this.currentFrame < (this.numFrames-1)) {
            this.currentFrame++;
        } else {
            this.currentFrame = 0;
        }
    }
}
class CollissionBlock {
    constructor({position, height=TILE_DIM}) {
        this.position = position;
        this.width= TILE_DIM;
        this.height=height
    }
    draw() {
    }
    update() {
        this.draw();
    }
}
function detectCollission({ obj1, obj2 }) {
    if (obj1.position.y + obj1.height >= obj2.position.y
        &&
        obj1.position.y <= obj2.position.y + obj2.height
        &&
        obj1.position.x <= obj2.position.x + obj2.width
        &&
        obj1.position.x + obj1.width >= obj2.position.x
    ) { return true } else { return false }
}
function platformCollission({ obj1, obj2 }) {
    if (obj1.position.y + obj1.height >= obj2.position.y
        &&
        obj1.position.y + obj1.height <= obj2.position.y + obj2.height
        &&
        obj1.position.x <= obj2.position.x + obj2.width
        &&
        obj1.position.x + obj1.width >= obj2.position.x
    ) { return true } else { return false }
}
function checkForHorizontalCollissions(object) {
    for(let i=0; i< currentLevel.collissionBlocksArray.length; i++) {
        const currentBlock = currentLevel.collissionBlocksArray[i]
        if ( detectCollission({ obj1: object, obj2: currentBlock}) ) {
            if(object.velocity.x > 0) {
                object.velocity.x = 0;
                object.position.x = currentBlock.position.x - object.width -0.02
                break
            }
            if(object.velocity.x<0) {
                object.velocity.x=0;
                object.position.x = currentBlock.position.x + currentBlock.width + 0.02
                break
            }
        }
    }
}
