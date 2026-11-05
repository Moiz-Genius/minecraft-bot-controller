const chalkAnimation = require('chalk-animation');
console.log('chalkAnimation keys:', Object.keys(chalkAnimation));
if (chalkAnimation.default) {
    console.log('chalkAnimation.default keys:', Object.keys(chalkAnimation.default));
} else {
    console.log('No default export');
}
