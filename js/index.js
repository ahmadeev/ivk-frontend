// game logic

// константы

const URL = "http://localhost:8080/api/squares/nextMove";

// глобальные переменные

let game = null;

function Game(size, nextPlayerColor) {
  this.size = size;
  this.nextPlayerColor = nextPlayerColor;
}
/** Меняет очередь хода (работает с 'black' и 'white')  */
Game.prototype.toggleColor = function() {
  if (this.nextPlayerColor === 'white') {
    this.nextPlayerColor = 'black';
  } else if (this.nextPlayerColor === 'black') {
    this.nextPlayerColor = 'white';
  } else {
    throw new Error("Ошибка смены цвета");
  }
}
Game.prototype.getShortenedColor = function() {
  return this.nextPlayerColor.charAt(0);
}

function createGrid(size) {
  // валидация размера игрового поля
  if (!size) {
    const message = "Размер игровой доски не определен";
    throw new Error(message);
  }
  if (size < 3 || size > 20) {
    const message = "Неверный размер игровой доски (должен быть в пределах от 3 до 20 единиц)";
    throw new Error(message);
  }

  // все ниже -- создание игрового поля

  const grid = document.getElementById('grid');

  grid.innerHTML = '';

  grid.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
  grid.style.gridTemplateRows = `repeat(${size}, 1fr)`;

  for (let i = 0; i < size * size; i++) {
    // координаты точки
    const x = i % size;
    const y = Math.floor(i / size);

    // ячейка внутри grid
    const cell = document.createElement('div');
    cell.className = 'cell';

    // камешек внутри ячейки
    const rock = document.createElement('div');
    rock.className = 'rock';
    rock.textContent = `(${x}, ${y})`;
    rock.title = `Ячейка (${x}, ${y})`;
    rock.dataset.x = String(x);
    rock.dataset.y = String(y);

    cell.appendChild(rock);
    grid.appendChild(cell);

    // обработчик клика по камню
    rock.addEventListener('click', onClick, { once: true });
  }
}
/** Обработчик кликов по полям доски (проверяет статус игры после хода игрока и выполняет ход компьютера) */
function onClick(e) {
  if (game === null) alert("Игра не была создана!");

  // сам ход человека
  const playerColor = game.nextPlayerColor;
  e.target.classList.add(playerColor);

  game.toggleColor(); // to comp color

  fetch(URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ size: game.size, data: parseBoardCoordinates(), nextPlayerColor: game.getShortenedColor() })
  })
  .then(res => res.json())
  .then(data => {
    console.log(data);
    switch (data.status) {
      case ("IN_PROCESS"):
        // извлекли данные из запроса
        const x = data.move.x;
        const y = data.move.y;
        const color = data.move.color;

        const rock = document.querySelector(`.rock[data-x="${x}"][data-y="${y}"]`);
        rock.removeEventListener('click', onClick);
        rock.classList.add(getFullColor(color)); // если ошибка тут, то значит пользователь вмешивался в работу кода
        game.toggleColor(); // back to player color // в случае ошибки, причина аналогична
        break;
      case ("END"):
        if (data.result === "COMPUTER_WIN") {
          // извлекли данные из запроса
          const x = data.move.x;
          const y = data.move.y;
          const color = data.move.color;

          const rock = document.querySelector(`.rock[data-x="${x}"][data-y="${y}"]`);
          rock.classList.add(getFullColor(color)); // если ошибка тут, то значит пользователь вмешивался в работу кода
          game.toggleColor(); // back to player color // в случае ошибки, причина аналогична
        }
        // todo: убрать hover
        const rocks = document.querySelectorAll(".rock");
        rocks.forEach(rock => rock.removeEventListener('click', onClick));
        alert(data.details);
        break;
      case ("INVALID"):
      default:
        throw new Error(data.details);
    }
  })
    .catch(err => {
      alert(err);
      // компенсационные действия
      e.target.classList.remove(playerColor); // note: слушатель удалился из-за once
      e.target.addEventListener('click', onClick, { once: true }); // wa: может можно лучше
    });
}

/** Получает доску из первоисточника (парсит HTML-элементы и возвращает строковое представление доски) */
function parseBoardCoordinates() {
  const rocks = [...document.getElementsByClassName('rock')];
  return rocks
    .map(rock => {
      if (rock.classList.contains('black')) {
        return 'b';
      } else if (rock.classList.contains('white')) {
        return 'w';
      }
      return " ";
    })
    .join("");
}

/** */
function getFullColor(shortened) {
  if (shortened.toLowerCase() === 'w') {
    return "white";
  } else if (shortened.toLowerCase() === 'b') {
    return "black";
  } else {
    throw new Error("Ошибка получения цвета");
  }
}

// ПОСЛЕ ЗАГРУЗКИ DOM

document.addEventListener('DOMContentLoaded', () => {
  let size = document.getElementById('grid-size').value;
  document.getElementById('create-game').addEventListener('click', (e) => {
    try {
      size = document.getElementById('grid-size').value || size;
      createGrid(size);
      game = new Game(size, "white");
    } catch (Error) {
      alert(Error.message);
    }
  });
});
