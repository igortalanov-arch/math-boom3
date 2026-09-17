# Релиз Мат-Бум! 3 — 1.0.1

## Файлы
| Файл | Назначение |
|------|------------|
| `math-boom-3-yandex-1.0.1.zip` | Загрузка в Яндекс Игры (`index.html` в корне) |
| `math-boom-3-pobeg-iz-sfery-1.0.1.html` | Solo: один HTML, офлайн, без архива |
| `game/` | Распакованная структура yandex-пакета |
| `texts/promo-fields.md` | Тексты черновика консоли |

## Локальная проверка solo
Откройте `math-boom-3-solo-1.0.1.html` двойным кликом (file://) или:
```bash
cd math-boom-3 && python3 -m http.server 8765
# http://127.0.0.1:8765/math-boom-3-solo-1.0.1.html
```

## Локальная проверка yandex-пакета
```bash
cd release-1.0.1/game && python3 -m http.server 8766
# http://127.0.0.1:8766/
```

## Требования портала (кратко)
- SDK `/sdk.js` с платформы (в zip не кладётся) — `js/platform.js`
- Без «яндекс игры» в UI
- Пауза звука при blur, гостевой прогресс, реклама в естественных паузах
- contextmenu/select отключены в platform.js
