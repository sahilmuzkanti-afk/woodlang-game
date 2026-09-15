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
function checkForVerticalCollissions(object) {
    for(let i=0; i< currentLevel.collissionBlocksArray.length; i++) {
        const currentBlock = currentLevel.collissionBlocksArray[i]
        if ( detectCollission({ obj1: object, obj2: currentBlock}) ) {
            if(object.velocity.y > 0) {
                object.velocity.y = 0;
                object.isGrounded=true;
             object.position.y = currentBlock.position.y -object.height-0.02
                break
            }
            if(object.velocity.y<0) {
                object.velocity.y=0;
                object.position.y = currentBlock.position.y  + currentBlock.height + 0.02
                break
            }
        }
    }
    for(let i=0; i< currentLevel.platformBlocksArray.length; i++) {
        const currentPlatform = currentLevel.platformBlocksArray[i]
        if ( platformCollission({ obj1: object, obj2: currentPlatform}) ) {
            if(object.velocity.y > 0) {
                object.velocity.y = 0;
                object.isGrounded=true;
                const offset = object.position.y - object.position.y + object.height
                object.position.y = currentPlatform.position.y -offset -0.02
                break
            }
        }
    }
}
class Coin extends Sprite {
    constructor({position, imgSrc = './img/coin.png', scale=1.5, numFrames = 14, value=1, animationSpeed = 10}) {
        super( {position: position, imageSrc: imgSrc , scale, numFrames, animationSpeed})
        this.isCollected = false
        this.value = value
    }
    update() {
        if(! this.isCollected) {
            this.draw();
            this.animate();
        }
    }
}
class Heart extends Sprite {
    constructor({position, imgSrc = './img/heart/heart_sheet.png', scale=2.5, numFrames = 5}) {
        super( {position: position, imageSrc: imgSrc , scale, numFrames})
        this.filled = 1.0,
        this.borderImg = new Image()
        this.borderImg.src= './img/heart/border.png'
    }
}
Heart.prototype.hurt = function() {
    if(this.filled === 0) {
        return
    } else {
        this.currentFrame++
        this.filled -= 0.25
   }
}
Heart.prototype.heal = function() {
    if(this.filled === 1 ) {
        return;
    } else {
        this.currentFrame --;
        this.filled += 0.25;
    }
}
Heart.prototype.draw = function() {
    if (!this.loaded )
        return;
    else {
        canvasContext.drawImage(
            this.borderImg,
            0,
            0,
            this.borderImg.width,
            this.borderImg.height,
            this.position.x,
            this.position.y,
            this.width,
            this.height
        )
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
class Player extends Sprite {
    constructor({ position, imgSrc, scale = 1, numFrames = 1, sprites }) {
        super({ position: position, imageSrc: imgSrc, scale, numFrames })
        this.velocity = {
            x: 0,
            y: 1
        },
        this.sides = {
            bottom: this.position.y + this.height,
            right: this.position.x + this.width,
            left: this.position.x,
            top: this.position.x
        },
        this.lastKey,
        this.sprites = sprites,
        this.direction = 'right',
        this.isAlive = true,
        this.cameraBox = {
            position: {
                x: this.position.x,
                y: this.position.y
            },
            width: 200,
            height: 100
        },
        this.hitBox = {
            position: {
                x: this.position.x,
                y: this.position.y,
            },
            width: 14,
            height: 24.5
        },
        this.isGrounded = false,
        this.coinsCollected = 0,
        this.hearts = [],
        this.life = 3.00,
        this.hurtSound = new Audio ('./audio/zelda_hit.mp3'),
        this.hurting = false
        for (const key in this.sprites) {
            this.sprites[key].image = new Image()
            this.sprites[key].image.src = this.sprites[key].spriteSrc
        }
        for (let i = 0; i < 3; i++) {
            this.hearts[i] = new Heart({
                position: {
                    x: canvas.width - 50 - i * 45,
                    y: 20
                }
            })
        }
    }
}
Player.prototype.panCameraLeft = function() {
    let cameraRight = this.cameraBox.position.x + this.cameraBox.width
    if (cameraRight >= currentLevel.mapWidth * TILE_DIM) {
        return
    }
    while (cameraRight >= (scaledCanvas.width + Math.abs(translateValues.position.x))) {
        translateValues.position.x -= this.velocity.x
    }
}
Player.prototype.panCameraRight = function() {
    if (this.cameraBox.position.x <= 0) {
        return;
    }
    while (this.cameraBox.position.x <= Math.abs(translateValues.position.x)) {
        translateValues.position.x -= this.velocity.x;
    }
}
Player.prototype.panCameraDown = function() {
    if ((this.cameraBox.position.y + this.velocity.y) <= 0) {
        return;
    }
    while (this.cameraBox.position.y <= Math.abs(translateValues.position.y)) {
        translateValues.position.y -= this.velocity.y
    }
}
Player.prototype.panCameraUp = function() {
    if ((this.cameraBox.position.y + this.cameraBox.height + this.velocity.y) >= currentLevel.mapHeight * TILE_DIM) {
        return;
    }
    while ((this.cameraBox.position.y + this.cameraBox.height) >= (Math.abs(translateValues.position.y) + scaledCanvas.height)) {
        translateValues.position.y -= this.velocity.y
    }
}
Player.prototype.updateBoxes = function() {
    this.cameraBox.position.x = this.position.x - 80
    this.cameraBox.position.y = this.position.y - 20
    this.hitBox.position.x = this.position.x + 7
    this.hitBox.position.y = this.position.y + 10
}
Player.prototype.update = function() {
    this.updateBoxes()
    this.sides.bottom = this.position.y + this.height;
    this.draw();
    if (this.isAlive)
        this.animate();
    else {
        this.velocity.x = 0
        this.velocity.y = 0
    }
    if (this.position.x + this.width + this.velocity.x >= currentLevel.mapWidth * TILE_DIM ||
        this.position.x + this.velocity.x <= 0) {
        this.velocity.x = 0;
    }
    if (this.position.y + this.height + this.velocity.y >= currentLevel.mapHeight * TILE_DIM) {
        this.velocity.y = 0;
    }
    this.position.x += this.velocity.x
    if (this.velocity.y > 0) {
        this.isGrounded = false;
    }
    this.life = 0;
    this.hearts.forEach(heart => {
        this.life += heart.filled;
    })
    if (this.life === 0 || (this.position.y + this.height) > currentLevel.waterLevel) {
        this.setSprite('death');
    }
    this.updateBoxes()
    checkForHorizontalCollissions(this);
    this.applyGravity();
    this.updateBoxes()
    this.checkForVerticalCollissions()
    this.checkForSlimesCollissions()
    this.checkForCoinCollection()
}
Player.prototype.applyGravity = function() {
    this.position.y += this.velocity.y
    this.velocity.y += GRAVITY
}
Player.prototype.resurrect = function() {
    this.coinsCollected = 0;
    this.isAlive = true;
    this.image = this.sprites.idleLeft.image
    this.numFrames = this.sprites.idleLeft.numFrames
    this.currentFrame = 0
    this.hearts.forEach(heart => {
        while (heart.filled !== 1) {
            heart.heal();
        }
    })
}
Player.prototype.checkForVerticalCollissions = function() {
    for (let i = 0; i < currentLevel.collissionBlocksArray.length; i++) {
        const currentBlock = currentLevel.collissionBlocksArray[i]
        if (detectCollission({ obj1: this, obj2: currentBlock })) {
            if (this.velocity.y > 0) {
                this.velocity.y = 0;
                this.isGrounded = true;
                this.position.y = currentBlock.position.y - this.height - 0.02
                break
            }
            if (this.velocity.y < 0) {
                this.velocity.y = 0;
                this.position.y = currentBlock.position.y + currentBlock.height + 0.02
                break
            }
        }
    }
    for (let i = 0; i < currentLevel.platformBlocksArray.length; i++) {
        const currentPlatform = currentLevel.platformBlocksArray[i]
        if (platformCollission({ obj1: this.hitBox, obj2: currentPlatform })) {
            if (this.velocity.y > 0) {
                this.velocity.y = 0;
                this.isGrounded = true;
                const offset = this.hitBox.position.y - this.position.y + this.hitBox.height
                this.position.y = currentPlatform.position.y - offset - 0.02
                break
            }
        }
    }
}
Player.prototype.checkForCoinCollection = function() {
    for (let i = 0; i < currentLevel.coinsArray.length; i++) {
        const currentCoin = currentLevel.coinsArray[i]
        if (detectCollission({ obj1: this.hitBox, obj2: currentCoin }) && currentCoin.isCollected == false) {
            currentLevel.coinsArray[i].isCollected = true;
            playGetCoin()
            this.coinsCollected++;
        setCoinBar((this.coinsCollected / currentLevel.numCoins) * 100)
        }
    }
}
Player.prototype.setSprite = function(sprite) {
    if((this.image == this.sprites.hurtLeft.image  || this.image == this.sprites.hurtRight.image ) && this.hurting) {
        return;
    }
    if (this.image == this.sprites.death.image) {
        if (this.image == this.sprites.death.image && this.currentFrame === (this.sprites.death.numFrames - 1)) {
            this.isAlive = false;
        }
        return
    }
    if ( (this.image == this.sprites.death.image && this.currentFrame < this.sprites.death.numFrames - 1)
     ) {
        return
    }
    switch (sprite) {
        case 'idleLeft':
            if (this.image !== this.sprites.idleLeft.image) {
                this.image = this.sprites.idleLeft.image
                this.numFrames = this.sprites.idleLeft.numFrames
                this.currentFrame = 0
            }
            break;
        case 'idleRight':
            if (this.image !== this.sprites.idleRight.image) {
                this.image = this.sprites.idleRight.image
                this.numFrames = this.sprites.idleRight.numFrames
                this.currentFrame = 0
            }
            break;
        case 'runLeft':
            if (this.image !== this.sprites.runLeft.image) {
                this.image = this.sprites.runLeft.image
                this.numFrames = this.sprites.runLeft.numFrames
                this.currentFrame = 0
            }
            break;
        case 'runRight':
            if (this.image !== this.sprites.runRight.image) {
                this.image = this.sprites.runRight.image
                this.numFrames = this.sprites.runRight.numFrames
                this.currentFrame = 0
            }
            break;
        case 'hurtRight':
            if (this.image !== this.sprites.hurtRight.image) {
                this.image = this.sprites.hurtRight.image
                this.numFrames = this.sprites.hurtRight.numFrames
                this.currentFrame = 1
            }
            break;
        case 'hurtLeft':
            if (this.image !== this.sprites.hurtLeft.image) {
                this.image = this.sprites.hurtLeft.image
                this.numFrames = this.sprites.hurtLeft.numFrames
                this.currentFrame = 1
            }
            break;
        case 'death':
            if (this.image !== this.sprites.death.image) {
                this.image = this.sprites.death.image
                this.numFrames = this.sprites.death.numFrames
                this.currentFrame = 0
            }
            break;
    }
}
function randomizeDirection() {
    let rand = Math.round( Math.random() );
    if(rand%2 === 0 ) {
        return 'right';
    } else {
        return 'left';
    }
}
function playGetCoin() {
    var getCoin = new Audio('./audio/oot_rupee_get.mp3')
    getCoin.play();
    getCoin.onended = function(){
        this.currentSrc = null;
        this.src = "";
        this.srcObject = null;
        this.remove();
    };
}
function onLeftOfSlime({ player, slime }) {
    if (player.position.x < slime.position.x)
        return true;
    else
        return false;
}
Player.prototype.checkForSlimesCollissions = function() {
    for (let i = 0; i < currentLevel.slimesArray.length; i++) {
        const currentSlime = currentLevel.slimesArray[i]
        if (detectCollission({ obj1: this.hitBox, obj2: currentSlime })) {
            if (this.velocity.y > 0 && !this.isGrounded && currentSlime.isAlive && (this.position.y + this.height < currentSlime.position.y + currentSlime.height - 10)) {
               currentLevel.slimesArray[i].setSprite("death")
               currentLevel.slimesArray[i].velocity.x = 0;
               currentLevel.slimesArray[i].hurtSound.play();
            }
            else {
                switch (currentSlime.direction) {
                    case 'left':
                        currentLevel.slimesArray[i].setSprite("attackLeft");
                        break;
                    case 'right':
                        currentLevel.slimesArray[i].setSprite("attackRight");
                        break;
                }
                if (!this.hurting &&  currentLevel.slimesArray[i].image !=  currentLevel.slimesArray[i].sprites.death.image) {
                    for (let i = 2; i >= 0; i--) {
                        if (this.hearts[i].filled !== 0) {
                            this.hearts[i].hurt();
                            this.hurting = true;
                            this.hurtSound.play();
                            setTimeout(() => {
                                this.hurting = false;
                            }, 500)
                            switch (this.direction) {
                                case 'left':
                                    this.setSprite("hurtLeft");
                                    break;
                                case 'right':
                                    this.setSprite("hurtRight");
                                    break;
                            }
                            break;
                        }
                    }
                }
            }
        } else if (inSlimeRange({ player: this, slime: currentSlime }) && currentSlime.image != currentSlime.sprites.death.image) {
            if (onLeftOfSlime({ player: this, slime: currentSlime })) {
                currentLevel.slimesArray[i].velocity.x = -MOVEMENT_SPEED;
                currentLevel.slimesArray[i].direction = 'left';
                currentLevel.slimesArray[i].setSprite("attackLeft");
            } else if (onRightOfSlime({ player: this, slime: currentSlime }) && currentSlime.image != currentSlime.sprites.death.image) {
                currentLevel.slimesArray[i].velocity.x = MOVEMENT_SPEED;
                currentLevel.slimesArray[i].direction = 'right';
                currentLevel.slimesArray[i].setSprite("attackRight");
            }
        } else {
            switch (currentSlime.direction) {
                case 'left':
                    currentLevel.slimesArray[i].setSprite("idleLeft");
                    break;
                case 'right':
                    currentLevel.slimesArray[i].setSprite("idleRight");
                    break;
            }
            currentLevel.slimesArray[i].velocity.x = 0;
        }
    }
    for (let i = 0; i < currentLevel.platformBlocksArray.length; i++) {
        const currentPlatform = currentLevel.platformBlocksArray[i]
        if (platformCollission({ obj1: this.hitBox, obj2: currentPlatform })) {
            if (this.velocity.y > 0) {
                this.velocity.y = 0;
                this.isGrounded = true;
                const offset = this.hitBox.position.y - this.position.y + this.hitBox.height
                this.position.y = currentPlatform.position.y - offset - 0.02
                break
            }
        }
    }
}
function inSlimeRange({ player, slime }) {
    if (player.position.y + ENEMY_VERTICAL_RANGE >= slime.position.y && player.position.y - ENEMY_VERTICAL_RANGE <= slime.position.y) {
        if(onRightOfSlime({player, slime})) {
            if(player.position.x < slime.position.x + slime.width*3) {
                return true;
            } else {
                return false;
            }
        } else if(onLeftOfSlime({player,slime})) {
            if(player.position.x > slime.position.x - slime.width*2) {
                return true;
            } else {
                return false;
            }
        } else {
            return false;
        }
    } else {
        return false;
    }
}
