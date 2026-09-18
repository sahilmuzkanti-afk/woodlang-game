const canvas = document.querySelector('canvas')
const canvasContext = canvas.getContext('2d')
const GAME_WIDTH = 64 * 16
canvas.width = GAME_WIDTH
const GAME_HEIGHT = 64 * 9
canvas.height = GAME_HEIGHT
let level = 1
const GRAVITY = 0.11
const JUMP_FORCE = -4
const MOVEMENT_SPEED = 1
const BACKGROUND_SCALE = 2.4
const ANIMATION_SPEED = 25
const TILE_DIM = 16
const ENEMY_VERTICAL_RANGE = 30
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
    constructor({ position, imageSrc, scale = 1, numFrames = 1, animationSpeed = ANIMATION_SPEED }) {
        this.position = position
        this.image = new Image()
        this.image.src = imageSrc
        this.loaded = false
        this.scale = scale
        this.numFrames = numFrames
        this.currentFrame = 0
        this.elapsedFrames = 0
        this.animationSpeed = animationSpeed
        this.image.onload = () => {
            this.loaded = true
            this.width = ( this.image.width/this.numFrames ) * this.scale
            this.height = (this.image.height ) * this.scale
        }
    }
}
Sprite.prototype.draw = function() {
    if (!this.loaded)
        return
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
    this.draw()
    this.animate()
}
Sprite.prototype.animate = function() {
    this.elapsedFrames++
    if (this.elapsedFrames % this.animationSpeed === 0 ) {
        if (this.currentFrame < (this.numFrames-1)) {
            this.currentFrame++
        } else {
            this.currentFrame = 0
        }
    }
}
class CollissionBlock {
    constructor({ position, height = TILE_DIM }) {
        this.position = position
        this.width = TILE_DIM
        this.height = height
    }
    draw() {
    }
    update() {
        this.draw()
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
    for (let i=0; i < currentLevel.collissionBlocksArray.length; i++) {
        const currentBlock = currentLevel.collissionBlocksArray[i]
        if ( detectCollission({ obj1: object, obj2: currentBlock }) ) {
            if (object.velocity.x > 0) {
                object.velocity.x = 0
                object.position.x = currentBlock.position.x - object.width -0.02
                break
            }
            if (object.velocity.x < 0) {
                object.velocity.x = 0
                object.position.x = currentBlock.position.x + currentBlock.width + 0.02
                break
            }
        }
    }
}
function checkForVerticalCollissions(object) {
    for (let i=0; i < currentLevel.collissionBlocksArray.length; i++) {
        const currentBlock = currentLevel.collissionBlocksArray[i]
        if ( detectCollission({ obj1: object, obj2: currentBlock }) ) {
            if (object.velocity.y > 0) {
                object.velocity.y = 0
                object.isGrounded=true
             object.position.y = currentBlock.position.y -object.height-0.02
                break
            }
            if (object.velocity.y < 0) {
                object.velocity.y = 0
                object.position.y = currentBlock.position.y  + currentBlock.height + 0.02
                break
            }
        }
    }
    for (let i = 0; i < currentLevel.platformBlocksArray.length; i++) {
        const currentPlatform = currentLevel.platformBlocksArray[i]
        if ( platformCollission({ obj1: object, obj2: currentPlatform }) ) {
            if (object.velocity.y > 0) {
                object.velocity.y = 0
                object.isGrounded=true
                const offset = object.position.y - object.position.y + object.height
                object.position.y = currentPlatform.position.y -offset -0.02
                break
            }
        }
    }
}
const coinParticles = []
function addCoinParticles(x, y) {
    for (let i = 0; i < 8; i++) {
        coinParticles.push({
            x: x + 8,
            y: y + 8,
            vx: (Math.random() - .5) * 2,
            vy: -Math.random() * 2,
            life: 26
        })
    }
}
function drawCoinParticles() {
    for (let i = coinParticles.length - 1; i >= 0; i--) {
        const particle = coinParticles[i]
        canvasContext.fillStyle = '#e4d053'
        canvasContext.fillRect(particle.x, particle.y, 2, 2)
        particle.x += particle.vx
        particle.y += particle.vy
        particle.vy += .05
        particle.life--
        if (particle.life <= 0) {
            coinParticles.splice(i, 1)
        }
    }
}
class Coin extends Sprite {
    constructor({ position, imgSrc = './img/coin.png', scale = 1.5, numFrames = 14, value = 1, animationSpeed = 10 }) {
        super( { position: position, imageSrc: imgSrc , scale, numFrames, animationSpeed })
        this.isCollected = false
        this.value = value
    }
    update() {
        if (! this.isCollected) {
            this.draw()
            this.animate()
        }
    }
}
class Heart extends Sprite {
    constructor({ position, imgSrc = './img/heart/heart_sheet.png', scale = 2.5, numFrames = 5 }) {
        super( { position: position, imageSrc: imgSrc , scale, numFrames })
        this.filled = 1.0,
        this.borderImg = new Image()
        this.borderImg.src = './img/heart/border.png'
    }
}
Heart.prototype.hurt = function() {
    if (this.filled === 0) {
        return
    } else {
        this.currentFrame++
        this.filled -= 0.25
   }
}
Heart.prototype.heal = function() {
    if (this.filled === 1 ) {
        return
    } else {
        this.currentFrame--
        this.filled += 0.25
    }
}
Heart.prototype.draw = function() {
    if (!this.loaded )
        return
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
        this.hurting = false,
        this.hurtUntil = 0,
        this.lastGroundedAt = Date.now(),
        this.jumpPressedAt = 0
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
        return
    }
    while (this.cameraBox.position.x <= Math.abs(translateValues.position.x)) {
        translateValues.position.x -= this.velocity.x;
    }
}
Player.prototype.panCameraDown = function() {
    if ((this.cameraBox.position.y + this.velocity.y) <= 0) {
        return
    }
    while (this.cameraBox.position.y <= Math.abs(translateValues.position.y)) {
        translateValues.position.y -= this.velocity.y
    }
}
Player.prototype.panCameraUp = function() {
    if ((this.cameraBox.position.y + this.cameraBox.height + this.velocity.y) >= currentLevel.mapHeight * TILE_DIM) {
        return
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
    this.sides.bottom = this.position.y + this.height
    if (!(Date.now() < this.hurtUntil && Math.floor(Date.now() / 90) % 2 === 0)) {
        this.draw()
    }
    if (this.isAlive)
        this.animate()
    else {
        this.velocity.x = 0
        this.velocity.y = 0
    }
    if (this.position.x + this.width + this.velocity.x >= currentLevel.mapWidth * TILE_DIM ||
        this.position.x + this.velocity.x <= 0) {
        this.velocity.x = 0
    }
    if (this.position.y + this.height + this.velocity.y >= currentLevel.mapHeight * TILE_DIM) {
        this.velocity.y = 0
    }
    this.position.x += this.velocity.x
    if (this.velocity.y > 0) {
        this.isGrounded = false
    }
    this.life = 0
    this.hearts.forEach(heart => {
        this.life += heart.filled
    })
    if (this.life === 0 || (this.position.y + this.height) > currentLevel.waterLevel) {
        this.setSprite('death')
    }
    this.updateBoxes()
    checkForHorizontalCollissions(this)
    this.applyGravity()
    this.updateBoxes()
    this.checkForVerticalCollissions()
    this.checkForSlimesCollissions()
    this.checkForCoinCollection()
}
Player.prototype.applyGravity = function() {
    this.position.y += this.velocity.y
    this.velocity.y += GRAVITY
    limitFallSpeed()
}
Player.prototype.resurrect = function() {
    this.coinsCollected = 0
    this.isAlive = true
    this.image = this.sprites.idleLeft.image
    this.numFrames = this.sprites.idleLeft.numFrames
    this.currentFrame = 0
    this.hearts.forEach(heart => {
        while (heart.filled !== 1) {
            heart.heal()
        }
    })
}
Player.prototype.checkForVerticalCollissions = function() {
    for (let i = 0; i < currentLevel.collissionBlocksArray.length; i++) {
        const currentBlock = currentLevel.collissionBlocksArray[i]
        if (detectCollission({ obj1: this, obj2: currentBlock })) {
            if (this.velocity.y > 0) {
                this.velocity.y = 0
                this.isGrounded = true
                this.lastGroundedAt = Date.now()
                this.position.y = currentBlock.position.y - this.height - 0.02
                break
            }
            if (this.velocity.y < 0) {
                this.velocity.y = 0
                this.position.y = currentBlock.position.y + currentBlock.height + 0.02
                break
            }
        }
    }
    for (let i = 0; i < currentLevel.platformBlocksArray.length; i++) {
        const currentPlatform = currentLevel.platformBlocksArray[i]
        if (platformCollission({ obj1: this.hitBox, obj2: currentPlatform })) {
            if (this.velocity.y > 0) {
                this.velocity.y = 0
                this.isGrounded = true
                this.lastGroundedAt = Date.now()
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
            currentLevel.coinsArray[i].isCollected = true
            playGetCoin()
            addCoinParticles(currentCoin.position.x, currentCoin.position.y)
            this.coinsCollected++
        setCoinBar((this.coinsCollected / currentLevel.numCoins) * 100)
            updateStatsPanel()
            updateCheckpointFromCoins()
        }
    }
}
Player.prototype.setSprite = function(sprite) {
    if ((this.image == this.sprites.hurtLeft.image  || this.image == this.sprites.hurtRight.image ) && Date.now() < this.hurtUntil) {
        return;
    }
    if (this.image == this.sprites.death.image) {
        if (this.image == this.sprites.death.image && this.currentFrame === (this.sprites.death.numFrames - 1)) {
            this.isAlive = false
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
            break
        case 'idleRight':
            if (this.image !== this.sprites.idleRight.image) {
                this.image = this.sprites.idleRight.image
                this.numFrames = this.sprites.idleRight.numFrames
                this.currentFrame = 0
            }
            break
        case 'runLeft':
            if (this.image !== this.sprites.runLeft.image) {
                this.image = this.sprites.runLeft.image
                this.numFrames = this.sprites.runLeft.numFrames
                this.currentFrame = 0
            }
            break
        case 'runRight':
            if (this.image !== this.sprites.runRight.image) {
                this.image = this.sprites.runRight.image
                this.numFrames = this.sprites.runRight.numFrames
                this.currentFrame = 0
            }
            break
        case 'hurtRight':
            if (this.image !== this.sprites.hurtRight.image) {
                this.image = this.sprites.hurtRight.image
                this.numFrames = this.sprites.hurtRight.numFrames
                this.currentFrame = 1
            }
            break
        case 'hurtLeft':
            if (this.image !== this.sprites.hurtLeft.image) {
                this.image = this.sprites.hurtLeft.image
                this.numFrames = this.sprites.hurtLeft.numFrames
                this.currentFrame = 1
            }
            break
        case 'death':
            if (this.image !== this.sprites.death.image) {
                this.image = this.sprites.death.image
                this.numFrames = this.sprites.death.numFrames
                this.currentFrame = 0
            }
            break
    }
}
function randomizeDirection() {
    let rand = Math.round( Math.random() )
    if (rand%2 === 0 ) {
        return 'right'
    } else {
        return 'left'
    }
}
function playSimpleSound(src) {
    if (gameState.muted) {
        return
    }
    const sound = new Audio(src)
    sound.play()
    sound.onended = function() {
        this.currentSrc = null
        this.src = ''
        this.srcObject = null
        this.remove()
    }
}
function setMuted(value) {
    gameState.muted = value
        if (muteBtnImg) {
        muteBtnImg.src = gameState.muted ? './img/mute.png' : './img/volume.png'
    }
}
function toggleMute() {
    setMuted(!gameState.muted)
}
function updateEnemyText() {
    const enemyText = document.getElementById('enemyText')
    if (!enemyText) {
        return
    }
    const defeated = currentLevel.slimesArray.filter(slime => !slime.isAlive).length
    enemyText.innerHTML = 'Enemies ' + defeated
}
function addEnemyDefeat() {
    updateEnemyText()
    if (typeof addScore === 'function') {
        addScore(25)
    }
}
function playGetCoin() {
    playSimpleSound('./audio/oot_rupee_get.mp3')
}
function onLeftOfSlime({ player, slime }) {
    if (player.position.x < slime.position.x)
        return true
    else
        return false
}
Player.prototype.checkForSlimesCollissions = function() {
    for (let i = 0; i < currentLevel.slimesArray.length; i++) {
        const currentSlime = currentLevel.slimesArray[i]
        if (detectCollission({ obj1: this.hitBox, obj2: currentSlime })) {
            if (this.velocity.y > 0 && !this.isGrounded && currentSlime.isAlive && (this.position.y + this.height < currentSlime.position.y + currentSlime.height - 10)) {
               currentLevel.slimesArray[i].setSprite("death")
               currentLevel.slimesArray[i].velocity.x = 0
               this.velocity.y = JUMP_FORCE * 0.75
               addEnemyDefeat()
               playSimpleSound('./audio/splat.mp3')
            }
            else {
                switch (currentSlime.direction) {
                    case 'left':
                        currentLevel.slimesArray[i].setSprite("attackLeft")
                        break
                    case 'right':
                        currentLevel.slimesArray[i].setSprite("attackRight")
                        break
                }
                if (Date.now() >= this.hurtUntil && currentLevel.slimesArray[i].image != currentLevel.slimesArray[i].sprites.death.image) {
                    for (let i = 2; i >= 0; i--) {
                        if (this.hearts[i].filled !== 0) {
                            this.hearts[i].hurt();
                            this.hurting = true;
                            this.hurtUntil = Date.now() + 900;
                            flashDamage();
                            playSimpleSound('./audio/zelda_hit.mp3')
                            setTimeout(() => {
                                this.hurting = false;
                            }, 500)
                            switch (this.direction) {
                                case 'left':
                                    this.setSprite("hurtLeft");
                                    break
                                case 'right':
                                    this.setSprite("hurtRight");
                                    break
                            }
                            break
                        }
                    }
                }
            }
        } else if (inSlimeRange({ player: this, slime: currentSlime }) && currentSlime.image != currentSlime.sprites.death.image) {
            if (onLeftOfSlime({ player: this, slime: currentSlime })) {
                currentLevel.slimesArray[i].velocity.x = -MOVEMENT_SPEED
                currentLevel.slimesArray[i].direction = 'left'
                currentLevel.slimesArray[i].setSprite("attackLeft")
            } else if (onRightOfSlime({ player: this, slime: currentSlime }) && currentSlime.image != currentSlime.sprites.death.image) {
                currentLevel.slimesArray[i].velocity.x = MOVEMENT_SPEED
                currentLevel.slimesArray[i].direction = 'right'
                currentLevel.slimesArray[i].setSprite("attackRight")
            }
        } else {
            switch (currentSlime.direction) {
                case 'left':
                    currentLevel.slimesArray[i].setSprite("idleLeft")
                    break
                case 'right':
                    currentLevel.slimesArray[i].setSprite("idleRight")
                    break
            }
            currentLevel.slimesArray[i].velocity.x = 0
        }
    }
    for (let i = 0; i < currentLevel.platformBlocksArray.length; i++) {
        const currentPlatform = currentLevel.platformBlocksArray[i]
        if (platformCollission({ obj1: this.hitBox, obj2: currentPlatform })) {
            if (this.velocity.y > 0) {
                this.velocity.y = 0
                this.isGrounded = true
                this.lastGroundedAt = Date.now()
                const offset = this.hitBox.position.y - this.position.y + this.hitBox.height
                this.position.y = currentPlatform.position.y - offset - 0.02
                break
            }
        }
    }
}
function inSlimeRange({ player, slime }) {
    if (player.position.y + ENEMY_VERTICAL_RANGE >= slime.position.y && player.position.y - ENEMY_VERTICAL_RANGE <= slime.position.y) {
        if (onRightOfSlime({ player, slime })) {
            if (player.position.x < slime.position.x + slime.width*3) {
                return true
            } else {
                return false
            }
        } else if (onLeftOfSlime({ player, slime })) {
            if (player.position.x > slime.position.x - slime.width*2) {
                return true
            } else {
                return false
            }
        } else {
            return false
        }
    } else {
        return false
    }
}
class Enemy extends Sprite {
    constructor({ position, imgSrc, scale = 1, numFrames = 1, sprites, animationSpeed = ANIMATION_SPEED }) {
        super( { position: position, imageSrc: imgSrc , scale, numFrames, animationSpeed })
        this.velocity = {
            x: 0,
            y: 0
        },
        this.sprites = sprites,
        this.direction = randomizeDirection(),
        this.startX = position.x,
        this.patrolDistance = 70,
        this.isAlive = true,
        this.hurtSound = new Audio('./audio/splat.mp3')
        for (const key in this.sprites) {
            this.sprites[key].image = new Image()
            this.sprites[key].image.src = this.sprites[key].spriteSrc
        }
    }
}
Enemy.prototype.applyGravity = function() {
    this.position.y += this.velocity.y
    this.velocity.y += GRAVITY
}
Enemy.prototype.update = function() {
    this.draw()
    if (this.isAlive) {
        this.animate()
        this.position.x += this.velocity.x
        keepEnemyOnPatrol(this)
        checkForHorizontalCollissions(this)
        this.applyGravity()
        checkForVerticalCollissions(this)
    }
}
function faceEnemy(enemy, direction) {
    enemy.direction = direction
    if (direction === 'left') {
        enemy.setSprite('attackLeft')
    } else {
        enemy.setSprite('attackRight')
    }
}
function keepEnemyOnPatrol(enemy) {
    if (enemy.position.x > enemy.startX + enemy.patrolDistance) {
        enemy.position.x = enemy.startX + enemy.patrolDistance
        enemy.velocity.x = -Math.abs(enemy.velocity.x || MOVEMENT_SPEED)
        faceEnemy(enemy, 'left')
    }
    if (enemy.position.x < enemy.startX - enemy.patrolDistance) {
        enemy.position.x = enemy.startX - enemy.patrolDistance
        enemy.velocity.x = Math.abs(enemy.velocity.x || MOVEMENT_SPEED)
        faceEnemy(enemy, 'right')
    }
}
function createSlime(xpos, ypos) {
    const slime = new Enemy( {
        position: {
            x: xpos,
            y: ypos - 11
        },
        imgSrc: './img/Slime/Idle_Left.png',
        scale: 1.3,
        numFrames: 4,
        sprites: {
            death: {
                spriteSrc: './img/Slime/Death.png',
                numFrames: 4
            },
            attackLeft: {
                spriteSrc: './img/Slime/Attack_Left.png',
                numFrames: 5
            },
            attackRight: {
                spriteSrc: './img/Slime/Attack_Right.png',
                numFrames: 5
            },
            idleLeft: {
                spriteSrc: './img/Slime/Idle_Left.png',
                numFrames: 4
            },
            idleRight: {
                spriteSrc: './img/Slime/Idle_Right.png',
                numFrames: 4
            },
        },
    })
    return slime
}
function playGameOver() {
    playSimpleSound('./audio/zelda_secret_sound.mp3')
}
function onRightOfSlime({ player, slime }) {
    if (player.position.x > slime.position.x + slime.width)
        return true
    else
        return false
}
function playVictory() {
    playSimpleSound('./audio/rupee-collect.mp3')
}
Enemy.prototype.setSprite = function(sprite) {
    if (this.image == this.sprites.death.image) {
        if (this.image == this.sprites.death.image && this.currentFrame === (this.sprites.death.numFrames-1) ) {
            this.isAlive = false
        }
        return
    }
    if (this.image === this.sprites.death.image && this.currentFrame < this.sprites.death.numFrames - 1) {
        return
    }
    if (sprite != 'death' && (this.image === this.sprites.attackLeft.image || this.image === this.sprites.attackRight.image) && this.currentFrame < this.sprites.attackLeft.numFrames - 1) {
        return
    }
    switch (sprite) {
        case 'idleLeft':
            if (this.image !== this.sprites.idleLeft.image) {
                this.image = this.sprites.idleLeft.image
                this.numFrames = this.sprites.idleLeft.numFrames
                this.currentFrame = 0
            }
            break
        case 'idleRight':
            if (this.image !== this.sprites.idleRight.image) {
                this.image = this.sprites.idleRight.image
                this.numFrames = this.sprites.idleRight.numFrames
                this.currentFrame = 0
            }
            break
        case 'runLeft':
            if (this.image !== this.sprites.runLeft.image) {
                this.image = this.sprites.runLeft.image
                this.numFrames = this.sprites.runLeft.numFrames
                this.currentFrame = 0
            }
            break
        case 'runRight':
            if (this.image !== this.sprites.runRight.image) {
                this.image = this.sprites.runRight.image
                this.numFrames = this.sprites.runRight.numFrames
                this.currentFrame = 0
            }
            break
        case 'death':
            if (this.image !== this.sprites.death.image) {
                this.image = this.sprites.death.image
                this.numFrames = this.sprites.death.numFrames
                this.currentFrame = 0
            }
            break
        case 'attackLeft':
        if (this.image !== this.sprites.attackLeft.image) {
            this.image = this.sprites.attackLeft.image
            this.numFrames = this.sprites.attackLeft.numFrames
            this.currentFrame=0
        }
        break
        case 'attackRight':
        if (this.image !== this.sprites.attackRight.image) {
            this.image = this.sprites.attackRight.image
            this.numFrames = this.sprites.attackRight.numFrames
            this.currentFrame=0
        }
        break;
    }
}
class Level extends Sprite {
    constructor({ position, imgSrc, scale = 1, numFrames = 1, animationSpeed = ANIMATION_SPEED }) {
        super({ position: position, imageSrc: imgSrc, scale, numFrames, animationSpeed })
        this.loaded = true,
        this.paused = false,
        this.mapWidth = 70,
        this.mapHeight = 40,
        this.numCoins = 0,
        this.levelNo = 1,
        this.waterLevel = 560,
        this.playerStartingYPos = scaledCanvas.height - (this.mapHeight * TILE_DIM),
        this.floorCollissions2D = [],
        this.platformCollissions2D = [],
        this.coins2D = [],
        this.slimes2D = [],
        this.collissionBlocksArray = [],
        this.platformBlocksArray = [],
        this.coinsArray = [],
        this.slimesArray = []
    }
}
function setComboBadge() {
    const comboBadge = document.getElementById('comboBadge')
    if (!comboBadge) {
        return
    }
    comboBadge.innerHTML = gameState.combo > 1 ? 'Combo x' + gameState.combo : ''
}
function addCombo() {
    const now = Date.now()
    if (now < gameState.comboUntil) {
        gameState.combo++
    } else {
        gameState.combo = 1
    }
    gameState.comboUntil = now + 1800
    setComboBadge()
}
function updateComboTimer() {
    if (gameState.combo > 0 && Date.now() > gameState.comboUntil) {
        gameState.combo = 0
        setComboBadge()
    }
}
function setLevelBadge() {
    const levelBadge = document.getElementById('levelBadge')
    if (levelBadge) {
        levelBadge.innerHTML = 'Level ' + level
    }
}
function updateStatsPanel() {
    const coinText = document.getElementById('coinText')
    const healthText = document.getElementById('healthText')
    if (coinText) {
        coinText.innerHTML = 'Coins ' + player.coinsCollected + '/' + currentLevel.numCoins
    }
    if (healthText) {
        healthText.innerHTML = 'Health ' + Math.ceil(player.life)
    }
}
function setCoinBar(percent) {
    const value = Math.max(0, Math.min(100, percent))
    document.getElementById('coinBar').style.width = value + '%'
}
Level.prototype.setupLevel = function(levelNo) {
    switch (levelNo) {
        case 1:
            this.image.src = './img/map1.png'
            this.levelNo = levelNo
            this.mapWidth = 70
            this.mapHeight = 40
            this.waterLevel = 560
            this.playerStartingYPos = 370
            this.yTranslateBg = scaledCanvas.height - (this.mapHeight * TILE_DIM)
            this.floorCollissions2D.length = 0
            for (let i = 0; i < floorCollissionsMap1.length; i += this.mapWidth) {
                this.floorCollissions2D.push(floorCollissionsMap1.slice(i, i +this.mapWidth))
            }
            this.platformCollissions2D.length = 0
            for (let i = 0; i < platformCollissionsMap1.length; i += this.mapWidth) {
                this.platformCollissions2D.push(platformCollissionsMap1.slice(i, i + this.mapWidth))
            }
            this.coins2D.length = 0
            for (let i = 0; i < coinsMap1.length; i += this.mapWidth) {
                this.coins2D.push(coinsMap1.slice(i, i + this.mapWidth))
            }
            this.slimes2D.length = 0
            for (let i = 0; i < slimesMap1.length; i += this.mapWidth) {
                this.slimes2D.push(slimesMap1.slice(i, i + this.mapWidth))
            }
            this.initArrays()
            break;
            case 2:
                this.image.src = './img/map2.png'
                this.levelNo = levelNo
                this.mapWidth = 100
                this.mapHeight = 25
                this.waterLevel = 360
                this.playerStartingYPos = 0
                this.yTranslateBg = 0
                this.floorCollissions2D.length = 0
                for (let i = 0; i < floorCollissionsMap2.length; i += this.mapWidth) {
                    this.floorCollissions2D.push(floorCollissionsMap2.slice(i, i +this.mapWidth))
                }
                this.platformCollissions2D.length = 0
                for (let i = 0; i < platformCollissionsMap2.length; i += this.mapWidth) {
                    this.platformCollissions2D.push(platformCollissionsMap2.slice(i, i + this.mapWidth))
                }
                this.coins2D.length = 0
                for (let i = 0; i < coinsMap2.length; i += this.mapWidth) {
                    this.coins2D.push(coinsMap2.slice(i, i + this.mapWidth))
                }
                this.slimes2D.length = 0
                for (let i = 0; i < slimesMap2.length; i += this.mapWidth) {
                    this.slimes2D.push(slimesMap2.slice(i, i + this.mapWidth))
                }
                this.initArrays()
                break;
    }
}
Level.prototype.pausedDraw = function() {
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
    this.collissionBlocksArray.forEach(collissionBlick => {
        collissionBlick.draw()
    })
    this.platformBlocksArray.forEach(platform => {
        platform.draw()
    })
    this.coinsArray.forEach(coin => {
        if (!coin.isCollected)
            coin.draw()
    })
    this.slimesArray.forEach(slime => {
        slime.draw()
    })
}
Level.prototype.clearObjects = function() {
    this.collissionBlocksArray.length = 0
    this.platformBlocksArray.length = 0
    this.coinsArray.length = 0
    this.slimesArray.length = 0
    this.numCoins = 0
}
Level.prototype.initArrays = function() {
    this.clearObjects()
    this.floorCollissions2D.forEach((row, y) => {
        row.forEach((item, x) => {
            if (item !== 0) {
                this.collissionBlocksArray.push(new CollissionBlock({
                    position: {
                        x: x * 16,
                        y: y * 16
                    }
                }))
            }
        })
    })
    this.platformCollissions2D.forEach((row, y) => {
        row.forEach((item, x) => {
            if (item !== 0) {
                this.platformBlocksArray.push(new CollissionBlock({
                    position: {
                        x: x * 16,
                        y: y * 16
                    },
                    height: 9
                }))
            }
        })
    })
    this.coins2D.forEach((row, y) => {
        row.forEach((item, x) => {
            if (item !== 0) {
                this.coinsArray.push(new Coin({
                    position: {
                        x: x * 16,
                        y: y * 16
                    }
                }))
                this.numCoins++
            }
        })
    })
    this.slimes2D.forEach((row, y) => {
        row.forEach((item, x) => {
            if (item !== 0) {
                this.slimesArray.push(createSlime(x * 16, y * 16))
            }
        })
    })
}
Level.prototype.update = function() {
    this.draw()
    this.animate()
    this.collissionBlocksArray.forEach(collissionBlick => {
        collissionBlick.update()
    })
    this.platformBlocksArray.forEach(platform => {
        platform.update()
    })
    this.coinsArray.forEach(coin => {
        coin.update()
    })
    this.slimesArray.forEach(slime => {
        slime.update()
    })
}
const level1Ground = [
    {
        x: 1088,
        y: 160,
        width: 32
    },
    {
        x: 1088,
        y: 176,
        width: 16
    },
    {
        x: 1072,
        y: 192,
        width: 16
    },
    { x: 1056, y: 208, width: 16 },
    { x: 1056, y: 224, width: 16 },
    { x: 1040, y: 240, width: 16 },
    { x: 1040, y: 256, width: 16 },
    { x: 1056, y: 272, width: 16 },
    { x: 1072, y: 288, width: 16 },
    { x: 1072, y: 304, width: 16 },
    { x: 1072, y: 320, width: 16 },
    { x: 1072, y: 336, width: 16 },
    { x: 1088, y: 352, width: 32 },
    { x: 320, y: 560, width: 528 },
    { x: 1040, y: 560, width: 80 },
    { x: 304, y: 576, width: 16 },
    { x: 848, y: 576, width: 16 },
    { x: 1024, y: 576, width: 32 },
    { x: 288, y: 592, width: 16 },
    { x: 848, y: 592, width: 32 },
    { x: 1008, y: 592, width: 32 },
    { x: 288, y: 608, width: 16 },
    { x: 864, y: 608, width: 16 },
    { x: 1008, y: 608, width: 16 },
    { x: 288, y: 624, width: 16 },
    { x: 864, y: 624, width: 16 },
    { x: 1008, y: 624, width: 16 },
]

const level1Platforms = [
    { x: 240, y: 80, width: 48 },
    { x: 976, y: 80, width: 112 },
    { x: 320, y: 112, width: 80 },
    { x: 480, y: 112, width: 32 },
    { x: 1088, y: 112, width: 32 },
    { x: 64, y: 128, width: 80 },
    { x: 672, y: 128, width: 96 },
    { x: 176, y: 176, width: 32 },
    { x: 544, y: 176, width: 80 },
    { x: 16, y: 224, width: 80 },
    { x: 496, y: 224, width: 32 },
    { x: 752, y: 224, width: 96 },
    { x: 224, y: 256, width: 80 },
    { x: 448, y: 288, width: 96 },
    { x: 928, y: 288, width: 80 },
    { x: 96, y: 320, width: 96 },
    { x: 576, y: 320, width: 32 },
    { x: 352, y: 368, width: 80 },
    { x: 512, y: 368, width: 32 },
    { x: 624, y: 368, width: 80 },
    { x: 992, y: 368, width: 32 },
    { x: 720, y: 400, width: 48 },
    { x: 192, y: 416, width: 80 },
    { x: 992, y: 432, width: 32 },
    { x: 512, y: 448, width: 80 },
    { x: 752, y: 448, width: 48 },
    { x: 1040, y: 464, width: 64 },
    { x: 0, y: 480, width: 128 },
    { x: 400, y: 480, width: 32 },
    { x: 640, y: 480, width: 80 },
    { x: 144, y: 496, width: 64 },
    { x: 1088, y: 512, width: 32 },
    { x: 240, y: 528, width: 128 },
]

const level1Coins = [
    { x: 352, y: 64 },
    { x: 576, y: 64 },
    { x: 96, y: 96 },
    { x: 1088, y: 112 },
    { x: 432, y: 128 },
    { x: 576, y: 144 },
    { x: 960, y: 144 },
    { x: 48, y: 176 },
    { x: 432, y: 176 },
    { x: 256, y: 208 },
    { x: 656, y: 240 },
    { x: 960, y: 240 },
    { x: 48, y: 288 },
    { x: 384, y: 288 },
    { x: 608, y: 288 },
    { x: 656, y: 288 },
    { x: 704, y: 288 },
    { x: 848, y: 320 },
    { x: 48, y: 336 },
    { x: 656, y: 336 },
    { x: 848, y: 384 },
    { x: 1040, y: 416 },
    { x: 1088, y: 416 },
    { x: 272, y: 496 },
    { x: 304, y: 496 },
    { x: 336, y: 496 },
    { x: 656, y: 528 },
    { x: 720, y: 528 },
    { x: 784, y: 528 },
]

const level1Enemies = [
    { x: 704, y: 112 },
    { x: 464, y: 272 },
    { x: 128, y: 304 },
    { x: 208, y: 400 },
    { x: 992, y: 416 },
    { x: 768, y: 432 },
    { x: 160, y: 480 },
    { x: 480, y: 544 },
    { x: 592, y: 544 },
    { x: 1056, y: 544 },
]

const level2Ground = [
    { x: 896, y: 80, width: 176 },
    { x: 896, y: 96, width: 176 },
    { x: 208, y: 144, width: 112 },
    { x: 192, y: 160, width: 32 },
    { x: 320, y: 160, width: 16 },
    { x: 192, y: 176, width: 16 },
    { x: 336, y: 176, width: 16 },
    { x: 192, y: 192, width: 16 },
    { x: 224, y: 192, width: 128 },
    { x: 192, y: 208, width: 16 },
    { x: 224, y: 208, width: 16 },
    { x: 192, y: 224, width: 16 },
    { x: 224, y: 224, width: 16 },
    { x: 192, y: 240, width: 16 },
    { x: 224, y: 240, width: 16 },
    { x: 192, y: 256, width: 16 },
    { x: 224, y: 256, width: 16 },
    { x: 192, y: 272, width: 16 },
    { x: 224, y: 272, width: 16 },
    { x: 192, y: 288, width: 16 },
    { x: 224, y: 288, width: 16 },
    { x: 192, y: 304, width: 16 },
    { x: 224, y: 304, width: 16 },
    { x: 192, y: 320, width: 16 },
    { x: 224, y: 320, width: 16 },
    { x: 192, y: 336, width: 16 },
    { x: 224, y: 336, width: 16 },
    { x: 192, y: 352, width: 16 },
    { x: 224, y: 352, width: 16 },
    { x: 448, y: 352, width: 256 },
    { x: 976, y: 352, width: 624 },
    { x: 192, y: 368, width: 16 },
    { x: 224, y: 368, width: 16 },
    { x: 432, y: 368, width: 288 },
    { x: 960, y: 368, width: 640 },
    { x: 0, y: 384, width: 208 },
    { x: 224, y: 384, width: 16 },
    { x: 416, y: 384, width: 32 },
    { x: 704, y: 384, width: 32 },
    { x: 944, y: 384, width: 48 },
]

const level2Platforms = [
    { x: 272, y: 48, width: 80 },
    { x: 1264, y: 48, width: 48 },
    { x: 400, y: 64, width: 48 },
    { x: 688, y: 80, width: 48 },
    { x: 1472, y: 80, width: 80 },
    { x: 0, y: 96, width: 64 },
    { x: 464, y: 112, width: 32 },
    { x: 1200, y: 112, width: 48 },
    { x: 752, y: 128, width: 80 },
    { x: 1344, y: 128, width: 80 },
    { x: 80, y: 144, width: 80 },
    { x: 656, y: 160, width: 32 },
    { x: 1104, y: 160, width: 80 },
    { x: 1552, y: 160, width: 48 },
    { x: 512, y: 176, width: 80 },
    { x: 32, y: 208, width: 80 },
    { x: 736, y: 208, width: 48 },
    { x: 912, y: 208, width: 32 },
    { x: 1168, y: 208, width: 48 },
    { x: 1424, y: 208, width: 80 },
    { x: 432, y: 240, width: 48 },
    { x: 1280, y: 240, width: 48 },
    { x: 112, y: 256, width: 32 },
    { x: 672, y: 256, width: 48 },
    { x: 1392, y: 256, width: 48 },
    { x: 912, y: 272, width: 32 },
    { x: 256, y: 288, width: 32 },
    { x: 160, y: 304, width: 48 },
    { x: 416, y: 304, width: 32 },
    { x: 336, y: 320, width: 32 },
    { x: 720, y: 320, width: 80 },
    { x: 848, y: 320, width: 32 },
    { x: 944, y: 320, width: 48 },
    { x: 96, y: 336, width: 32 },
]

const level2Coins = [
    { x: 304, y: 16 },
    { x: 1376, y: 32 },
    { x: 1504, y: 32 },
    { x: 1008, y: 48 },
    { x: 1040, y: 48 },
    { x: 544, y: 64 },
    { x: 1136, y: 64 },
    { x: 1376, y: 64 },
    { x: 1216, y: 80 },
    { x: 112, y: 96 },
    { x: 336, y: 112 },
    { x: 1296, y: 112 },
    { x: 544, y: 128 },
    { x: 1456, y: 128 },
    { x: 1568, y: 128 },
    { x: 1296, y: 144 },
    { x: 416, y: 160 },
    { x: 1216, y: 160 },
    { x: 160, y: 176 },
    { x: 816, y: 192 },
    { x: 160, y: 208 },
    { x: 688, y: 208 },
    { x: 272, y: 240 },
    { x: 256, y: 256 },
    { x: 816, y: 256 },
    { x: 160, y: 272 },
    { x: 800, y: 272 },
    { x: 832, y: 272 },
    { x: 960, y: 272 },
    { x: 336, y: 288 },
    { x: 736, y: 288 },
    { x: 112, y: 304 },
    { x: 512, y: 320 },
    { x: 560, y: 320 },
    { x: 608, y: 320 },
]

const level2Enemies = [
    { x: 416, y: 48 },
    { x: 704, y: 64 },
    { x: 1024, y: 64 },
    { x: 1376, y: 112 },
    { x: 240, y: 128 },
    { x: 1136, y: 144 },
    { x: 48, y: 192 },
    { x: 1200, y: 192 },
    { x: 1472, y: 192 },
    { x: 448, y: 224 },
    { x: 1296, y: 224 },
    { x: 688, y: 240 },
    { x: 752, y: 304 },
    { x: 528, y: 336 },
    { x: 592, y: 336 },
    { x: 1088, y: 336 },
]

function addBlocks(list, pieces, height = 16) {
    pieces.forEach(piece => {
        const end = piece.x + piece.width
        for (let x = piece.x; x < end; x += 16) {
            list.push(new CollissionBlock({
                position: {
                    x: x,
                    y: piece.y
                },
                height: height
            }))
        }
    })
}

function addCoins(list, coins) {
    coins.forEach(coin => {
        list.push(new Coin({
            position: {
                x: coin.x,
                y: coin.y
            }
        }))
    })
}

function addEnemies(list, enemies) {
    enemies.forEach(enemy => {
        list.push(createSlime(enemy.x, enemy.y))
    })
}

Level.prototype.setupLevel = function(levelNo) {
    this.clearObjects()
    this.levelNo = levelNo

    let ground = level1Ground
    let platforms = level1Platforms
    let coins = level1Coins
    let enemies = level1Enemies

    if (levelNo === 1) {
        this.image.src = './img/map1.png'
        this.mapWidth = 70
        this.mapHeight = 40
        this.waterLevel = 560
        this.playerStartingYPos = 370
        this.yTranslateBg = scaledCanvas.height - (40 * 16)
    }

    if (levelNo === 2) {
        this.image.src = './img/map2.png'
        this.mapWidth = 100
        this.mapHeight = 25
        this.waterLevel = 360
        this.playerStartingYPos = 0
        this.yTranslateBg = 0
        ground = level2Ground
        platforms = level2Platforms
        coins = level2Coins
        enemies = level2Enemies
    }

    addBlocks(this.collissionBlocksArray, ground)
    addBlocks(this.platformBlocksArray, platforms, 9)
    addCoins(this.coinsArray, coins)
    addEnemies(this.slimesArray, enemies)
    this.numCoins = coins.length
}

const GameOverSheet = new Sprite({
   position: {
    x: canvas.width/2 - 180,
    y: canvas.height/2 - 70
   },
   scale: 4,
   numFrames: 12,
   animationSpeed: 10,
   imageSrc: './img/GameOver-Sheet.png'
})
const VictorySheet = new Sprite({
    position: {
     x: canvas.width/2 - 140,
     y: canvas.height/2 - 80
    },
    scale: 4,
    numFrames: 13,
    animationSpeed: 4,
    imageSrc: './img/Victory.png'
 })
const currentLevel = new Level({
    position: {
        x: 0,
        y: 0
    },
    imgSrc: './img/map1.png'
})
currentLevel.setupLevel(1)
level = 1
setLevelBadge()
const player = new Player({
    position: {
        x: 20,
        y: currentLevel.playerStartingYPos
    },
    imgSrc: './img/Player/Idle_Right.png',
    scale: 1.5,
    numFrames: 2,
    sprites: {
        idleLeft: {
            spriteSrc: './img/Player/Idle_Left.png',
            numFrames: 2
        },
        idleRight: {
            spriteSrc: './img/Player/Idle_Right.png',
            numFrames: 2
        },
        runLeft: {
            spriteSrc: './img/Player/Run_Left.png',
            numFrames: 4
        },
        runRight: {
            spriteSrc: './img/Player/Run_Right.png',
            numFrames: 4
        },
        hurtLeft: {
            spriteSrc: './img/Player/Hurt_Left.png',
            numFrames: 2
        },
        hurtRight: {
            spriteSrc: './img/Player/Hurt_Right.png',
            numFrames: 2
        },
        death: {
            spriteSrc: './img/Player/Death.png',
            numFrames: 9
        }
    }
})
const scoreInfo = document.getElementById('scoreInfo')
const pauseBtnImg = document.getElementById('pauseBtnImg')
const translateValues = {
    position: {
        x: 0,
        y: currentLevel.yTranslateBg
    }
}
const overlay = {
    opacity: 0,
    target: 0
}
const gameState = {
    finalVictory: false,
    levelChanging: false,
    muted: false,
    startedAt: Date.now(),
    elapsedMs: 0,
    score: 0,
    combo: 0,
    comboUntil: 0,
    transitionTimer: null,
    checkpoint: {
        x: 20,
        y: currentLevel.playerStartingYPos
    },
    difficulty: 'normal'
}
function resetRunState() {
    gameState.finalVictory = false
    gameState.levelChanging = false
    gameState.startedAt = Date.now()
    gameState.elapsedMs = 0
    gameState.score = 0
    gameState.combo = 0
    gameState.comboUntil = 0
}
function resetLevelState() {
    setCheckpoint(20, currentLevel.playerStartingYPos)
}
function setCheckpoint(x, y) {
    gameState.checkpoint.x = x
    gameState.checkpoint.y = y
    const checkpointText = document.getElementById('checkpointText')
    if (checkpointText) {
        checkpointText.innerHTML = x === 20 ? 'Start' : 'Checkpoint'
    }
}
function showCheckpointBanner() {
    const banner = document.getElementById('checkpointBanner')
    if (!banner) {
        return
    }
    banner.innerHTML = 'Checkpoint saved'
    banner.classList.add('show')
    setTimeout(() => banner.classList.remove('show'), 900)
}
function updateCheckpointFromCoins() {
    if (player.coinsCollected === 0 || currentLevel.numCoins === 0) {
        return
    }
    const checkpointEvery = Math.max(1, Math.ceil(currentLevel.numCoins / 3))
    if (player.coinsCollected % checkpointEvery !== 0) {
        return
    }
    setCheckpoint(player.position.x, player.position.y)
    showCheckpointBanner()
}
function cancelLevelChange() {
    if (gameState.transitionTimer !== null) {
        clearTimeout(gameState.transitionTimer)
        gameState.transitionTimer = null
    }
    gameState.levelChanging = false
}
function resetPlayerState() {
    player.position.x = gameState.checkpoint.x
    player.position.y = gameState.checkpoint.y
    player.velocity.x = 0
    player.velocity.y = 0
    player.lastKey = undefined
    player.isGrounded = false
    player.hurting = false
    player.hurtUntil = 0
    player.jumpPressedAt = 0
    player.resurrect()
    player.updateBoxes()
}
function resetViewState() {
    translateValues.position.x = 0
    translateValues.position.y = currentLevel.yTranslateBg
    overlay.opacity = 0
    overlay.target = 0
    canvasContext.setTransform(1, 0, 0, 1, 0, 0)
    canvasContext.clearRect(0, 0, canvas.width, canvas.height)
}
function canPlay() {
    return !currentLevel.paused && !gameState.finalVictory && !gameState.levelChanging
}
let gameOverPlayed = false
function restart() {
    cancelLevelChange()
    clearMovementKeys()
    currentLevel.paused = false
    currentLevel.loaded = true
    gameState.finalVictory = false
    currentLevel.setupLevel(level)
    resetLevelState()
    resetPlayerState()
    resetViewState()
    setLevelBadge()
    setPauseIcon(false)
    hideCenterText()
    setCoinBar(0)
    if (typeof coinParticles !== 'undefined') {
        coinParticles.length = 0
    }
    gameOverPlayed = false
    resetRunState()
    updateStatsPanel()
}
function pause() {
    if (!currentLevel.paused) {
        currentLevel.paused = true
        setPauseIcon(true)
    } else {
        currentLevel.paused = false
        hideCenterText()
        setPauseIcon(false)
        applyOverlay(0, 'black')
    }
}
const ui = {
    refreshBtn: document.getElementById('refreshBtn'),
    pauseBtn: document.getElementById('pauseBtn'),
    muteBtn: document.getElementById('muteBtn'),
    pauseBtnImg: document.getElementById('pauseBtnImg'),
    scoreInfo: document.getElementById('scoreInfo')
}
function showCenterText(text) {
    ui.scoreInfo.style.display = 'flex'
    ui.scoreInfo.innerHTML = text
}
function hideCenterText() {
    ui.scoreInfo.style.display = 'none'
}
function setPauseIcon(paused) {
    ui.pauseBtnImg.src = paused ? './img/play.png' : './img/pause.png'
}
ui.refreshBtn.addEventListener('click', restart)
ui.pauseBtn.addEventListener('click', pause)
ui.muteBtn.addEventListener('click', toggleMute)
function applyOverlay(alpha, color) {
    canvasContext.save()
    canvasContext.globalAlpha = overlay.opacity
    canvasContext.fillStyle = color
    canvasContext.fillRect(0, 0, canvas.width, canvas.height)
    canvasContext.restore()
    overlay.target = alpha
}
function isMoveKey(key) {
    return key === 'a' || key === 'A' || key === 'ArrowLeft' ||
        key === 'd' || key === 'D' || key === 'ArrowRight'
}
function isJumpKey(key) {
    return key === 'w' || key === 'W' || key === 'ArrowUp'
}
function isPauseKey(key) {
    return key === 'p' || key === 'P'
}
function isRestartKey(key) {
    return key === 'r' || key === 'R'
}

function flashDamage() {
    document.body.classList.add('hurtFlash')
    setTimeout(() => {
        document.body.classList.remove('hurtFlash')
    }, 250)
}
function jumpPlayer() {
    if (!canPlay()) {
        return
    }
    const now = Date.now()
    if (player.isGrounded || now - player.lastGroundedAt < 120) {
        player.velocity.y = JUMP_FORCE
        player.isGrounded = false
        player.jumpPressedAt = 0
        return
    }
    player.jumpPressedAt = now
}
function updateJumpFeelText() {
    const jumpFeelText = document.getElementById('jumpFeelText')
    if (!jumpFeelText) {
        return
    }
    if (!player.isGrounded && player.velocity.y < 0) {
        jumpFeelText.innerHTML = 'Hold jump to rise'
        return
    }
    if (!player.isGrounded && player.velocity.y >= 0) {
        jumpFeelText.innerHTML = 'Falling'
        return
    }
    jumpFeelText.innerHTML = 'Tap jump for short hops'
}
function stopJumpEarly() {
    if (player.velocity.y < -1.7) {
        player.velocity.y = -1.7
    }
}
function limitFallSpeed() {
    if (player.velocity.y > 6) {
        player.velocity.y = 6
    }
}
function useBufferedJump() {
    if (!player.jumpPressedAt) {
        return
    }
    if (Date.now() - player.jumpPressedAt > 140) {
        player.jumpPressedAt = 0
        return
    }
    if (player.isGrounded) {
        jumpPlayer()
    }
}
window.addEventListener('keydown', (event) => {
    switch (event.key) {
        case 'w':
        case 'W':
        case 'ArrowUp':
            event.preventDefault()
            jumpPlayer()
            KEYS.w.pressed = true
            player.lastKey = 'w'
            break
        case 'd':
        case 'D':
        case 'ArrowRight':
            event.preventDefault()
            player.lastKey = 'd'
            KEYS.d.pressed = true
            break
        case 'a':
        case 'A':
        case 'ArrowLeft':
            event.preventDefault()
            player.lastKey = 'a'
            KEYS.a.pressed = true
            break
        case 'p':
        case 'P':
            pause()
            break
        case 'r':
        case 'R':
            restart()
            break
        case ' ':
            event.preventDefault()
            jumpPlayer()
            break
    }
})
function clearMovementKeys() {
    KEYS.a.pressed = false
    KEYS.d.pressed = false
    KEYS.w.pressed = false
}
function handleWindowBlur() {
    clearMovementKeys()
}
window.addEventListener('blur', handleWindowBlur)
function setTouchKey(keyName, pressed) {
    KEYS[keyName].pressed = pressed
    if (pressed) {
        player.lastKey = keyName
    }
}
function bindTouchButton(id, keyName) {
    const button = document.getElementById(id)
    if (!button) {
        return
    }
    button.addEventListener('pointerdown', event => {
        event.preventDefault()
        if (keyName === 'w') {
            jumpPlayer()
        }
        setTouchKey(keyName, true)
    })
    button.addEventListener('pointerup', () => setTouchKey(keyName, false))
    button.addEventListener('pointercancel', () => setTouchKey(keyName, false))
    button.addEventListener('pointerleave', () => setTouchKey(keyName, false))
}
bindTouchButton('touchLeft', 'a')
bindTouchButton('touchJump', 'w')
bindTouchButton('touchRight', 'd')
function updatePlayerMovement() {
    if (KEYS.a.pressed && player.lastKey == 'a') {
        player.velocity.x = -MOVEMENT_SPEED
        player.setSprite('runLeft')
        player.direction = 'left'
    } else if (KEYS.d.pressed && player.lastKey == 'd') {
        player.velocity.x = MOVEMENT_SPEED
        player.setSprite('runRight')
        player.direction = 'right'
    } else {
        player.velocity.x = 0
        if (player.direction === 'left') {
            player.setSprite('idleLeft')
        } else {
            player.setSprite('idleRight')
        }
    }
}
function drawWaterWarning() {
    const bottom = player.position.y + player.height
    const distance = currentLevel.waterLevel - bottom
    if (distance > 75 || distance < 0 || !player.isAlive) {
        return
    }
    canvasContext.save()
    canvasContext.fillStyle = 'rgba(255, 245, 190, .95)'
    canvasContext.font = '18px Syne Mono'
    canvasContext.fillText('Water close', 24, 88)
    canvasContext.restore()
}
function drawDangerLine() {
    canvasContext.save()
    canvasContext.strokeStyle = 'rgba(100, 220, 255, .8)'
    canvasContext.lineWidth = 2
    canvasContext.beginPath()
    canvasContext.moveTo(0, currentLevel.waterLevel)
    canvasContext.lineTo(currentLevel.mapWidth * TILE_DIM, currentLevel.waterLevel)
    canvasContext.stroke()
    canvasContext.restore()
}
function animate() {
    window.requestAnimationFrame(animate)
    canvasContext.setTransform(1, 0, 0, 1, 0, 0)
    overlay.opacity += (overlay.target - overlay.opacity) * 0.08
    canvasContext.fillStyle = 'white'
    canvasContext.fillRect(0, 0, canvas.width, canvas.height)
    canvasContext.save()
    canvasContext.scale(BACKGROUND_SCALE, BACKGROUND_SCALE)
    canvasContext.translate(translateValues.position.x, translateValues.position.y)
    if (!currentLevel.paused) {
        currentLevel.update()
        drawDangerLine()
        drawCoinParticles()
        player.update()
    } else {
        currentLevel.pausedDraw()
        player.draw()
    }
    canvasContext.restore()
    player.hearts.forEach(heart => {
        heart.draw()
    })
    drawWaterWarning()
    updateStatsPanel()
    if (currentLevel.paused) {
        applyOverlay(0.8, 'black')
        player.hearts.forEach(heart => {
            heart.draw()
        })
        showCenterText('Game Paused')
        return;
    }
    if (!currentLevel.loaded ) {
        canvasContext.fillStyle = 'rgba(124,148,161,255)'
        canvasContext.fillRect(0, 0, canvas.width, canvas.height)
        VictorySheet.update()
    }
    if (player.coinsCollected === currentLevel.numCoins) {
        currentLevel.loaded = false;
        player.coinsCollected =0;
        if(!currentLevel.loaded ) {
            gameState.transitionTimer = setTimeout(() => {
                canvasContext.setTransform(1, 0, 0, 1, 0, 0)
                canvasContext.clearRect(0, 0, canvas.width, canvas.height)
                currentLevel.setupLevel(++level);
                setLevelBadge();
                player.position.y = currentLevel.playerStartingYPos;
                player.position.x = 20;
                translateValues.position.y = currentLevel.yTranslateBg;
                translateValues.position.x = 0;
                currentLevel.loaded = true;
                setCoinBar(0)
            }, 3000)
        }
        playVictory()
    }
    if (!player.isAlive) {
        canvasContext.fillStyle = 'rgba(78,60,92,255)'
        canvasContext.fillRect(0, 0, canvas.width, canvas.height)
        GameOverSheet.update()
        if (!gameOverPlayed) {
            playGameOver()
            gameOverPlayed = true
        }
    }
    if (player.velocity.y < 0) {
        player.panCameraDown()
    } else if (player.velocity.y > 0) {
        player.panCameraUp()
    }
    if (player.velocity.x < 0) {
        player.panCameraRight()
    } else if (player.velocity.x > 0) {
        player.panCameraLeft()
    }
    updateJumpFeelText()
    updateComboTimer()
    useBufferedJump()
    updatePlayerMovement()
}
animate()
window.addEventListener('pointerup', () => {
    stopJumpEarly()
})
window.addEventListener('keyup', (event) => {
    switch (event.key) {
        case 'w':
        case 'W':
        case 'ArrowUp':
            stopJumpEarly()
            KEYS.w.pressed = false
            break
        case 'd':
        case 'D':
        case 'ArrowRight':
            KEYS.d.pressed = false
            break
        case 'a':
        case 'A':
        case 'ArrowLeft':
            KEYS.a.pressed = false
            break
    }
})
