# MyWeb engine
Реактивный шаблонизарор для веб-сайтов.

## Основные идеи
- Простота и скорость
- Один шаблон для сервера и для клиента
- Декларотивнное описание процессов взаимодействия
- Независимость от серверного ПО
- Отсутствие "бойлерного кода"
- Отсутстве зависимостей от сторонних библиотек

## Как использовать
```html
<html>
	<head>
		<script src="https://mywebengine.org/myweb/tpl.js" type="module" async="async"></script>
		<script>
			data = {
				foo: ["a", "b", "c"]
			};
		</script>
	</head>
	<body>
		<ul _if="data.foo.length">
			<li _for.bar="data.foo">
				{{bar.toUpperCase()}}
			</li>
		</ul>
	</body>
</html>
```

## Отладка
Нужно при подключении скрипта шаблона указать параметр **debug**, 
после чего в выводе информации об ошибоке, дополнительно 
будут указаны: файл испточник и номер строки в которой произошла ошибка.
```html
<script src="https://mywebengine.org/myweb/tpl.js?debug" type="module" async="async"></script>
```
/*depricated
## Запуск шаблона 
Поумолчанию шаблонищзатар начинает совю работу на стадии "onload", 
но можно стартовать раньше - на "DOMContentLoaded", указав параметр **ondomready**.
```html
<script src="https://mywebengine.org/myweb/tpl.js?ondomready" type="module" async="async"></script>
```*/
## Синтаксис инструкций

### Примеры
- []()
- []()
- []()

### html

### if, switch

### attr

### on

### for

### inc

### scope

### fetch

## API
