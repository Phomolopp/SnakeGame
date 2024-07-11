
# Snake Game Documentation
## Overview
The Snake game is a classic arcade game implemented using HTML, CSS, and JavaScript. The player controls a snake that moves around a grid, eating fruit to grow longer. The game ends if the snake collides with itself. This documentation provides a detailed explanation of the game's structure and functionality.

# HTML Structure
The HTML file defines the layout of the game, including a canvas for rendering the game, a score display, a game over message with a restart button, and directional control buttons for user interaction.

    <canvas>: Used to draw the game.
    Score Display: Shows the current score.
    Game Over Message: Displays when the game ends, with a restart button to reset the game.
    Control Buttons: Buttons to control the snake's movement on mobile devices.
# CSS Styling
The CSS file styles the game elements, ensuring a visually appealing and user-friendly interface.

    Body and HTML: Set up a full-screen display with centered content.
    Canvas: Styled with a black background and white border.
    Score: Styled with white color and positioned below the canvas.
    Game Over Message: Styled with red color and displayed when the game ends.
    Restart Button: Styled with a background color, padding, and cursor pointer.
    Control Buttons: Styled with a background color, padding, and cursor pointer, arranged for ease      of use on mobile devices.
# JavaScript Functionality
The JavaScript file handles the game logic, including initialization, game loop, user input, and game state management.

# Key Variables and Constants
    Canvas and Context: canvas and ctx for drawing on the canvas.
    Score Element: scoreElement to display the score.
    Game Over Message: gameOverMessage for displaying the game over message.
    Restart Button: restartButton for restarting the game.
    Scale: scale defines the size of each grid cell.
    Rows and Columns: rows and columns calculate the number of rows and columns in the grid.
    Game State: Variables snake, fruit, score, and interval track the game state.
# Setup Function
Initializes the game, setting up the canvas, creating instances of the Snake and Fruit classes, and starting the game loop.

    Canvas Size: Set to 400x400 pixels.
    Snake and Fruit: Instances of the Snake and Fruit classes are created.
    Game Loop: Uses setInterval to update the game state every 250 milliseconds.
# Reset Game Function
Resets the game state, allowing the player to start a new game.

    Score Reset: Resets the score to 0.
    Hide Game Over Message: Hides the game over message.
    Clear Interval: Stops the current game loop.
    Restart Game: Calls the setup function to restart the game.
# Event Listeners
Handle user inputs for controlling the snake's movement and restarting the game.

    Keyboard Controls: keydown event listener for arrow keys.
    Button Controls: Click event listeners for control buttons.
    Restart Button: Click event listener to reset the game.
# Game Over Function
Stops the game and displays the game over message.

    Clear Interval: Stops the game loop.
    Show Game Over Message: Displays the game over message.
# Snake Class
Defines the snake's behavior, including movement, drawing, direction change, eating fruit, and collision detection.

Properties: x, y, xSpeed, ySpeed, total, and tail to track the snake's position, speed, length, and tail segments.
## Methods:
    draw: Draws the snake on the canvas.
    update: Updates the snake's position and handles wrapping around the edges.
    changeDirection: Changes the snake's direction based on user input.
    eat: Checks if the snake eats the fruit and grows.
    checkCollision: Checks if the snake collides with itself.
# Fruit Class
Defines the fruit's behavior, including picking a random location and drawing on the canvas.

    Properties: x and y to track the fruit's position.
    Methods:
    pickLocation: Picks a random location for the fruit.
    draw: Draws the fruit on the canvas.
# Summary
This Snake game implementation uses HTML for structure, CSS for styling, and JavaScript for game logic. The game allows the player to control a snake to eat fruit and grow longer while avoiding collisions with itself. The game provides a user-friendly interface with keyboard and button controls and allows restarting the game after a game over.
