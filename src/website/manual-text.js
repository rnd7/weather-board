export default `<b>Manual</b>

---

<b>Login page</b>

You can return to the Login page by clicking <b>Logout</b> in the <b>Menu</b>.

---

<b>Grid page</b>

The grid is like a giant text document that everybody can edit simultaneously. There is only one global grid, everything you write is public.

-

<b>Keyboard Controls</b>

The Weather Board was primarily designed for keyboard use. Since you write single letters to a fixed grid there is nothing like a line or a break. Every character stays where it was placed.

<b>UP, DOWN, LEFT, RIGHT</b>
Move the cursor. Hold <b>SHIFT</b> to move by 10 units.

<b>TYPE</b>
Write to the public buffer.

<b>ENTER</b>
Simulate linefeed.

<b>TAB</b>
Open Command Prompt at cursor position.

-

<b>Touch / Mouse Controls</b>

Instead of using the keyboard you can navigate using your preferred pointing device.

<b>DRAG</b>
Pan view around.

<b>CLICK</b>
Place cursor.

<b>LONGPRESS</b>
Place pointer and open Command Prompt at this position.

<b>WHEEL</b>
Scroll vertically. Hold <b>SHIFT</b> to scroll horizontally.

---

<b>Command Prompt</b>

The Weather Board client supports entering text using a Command Prompt. Especially useful with virtual keyboards. Press <b>TAB</b> or <b>LONGPRESS</b> to open. 

Within the Command Prompt you can write text and publish it clicking on the <b>Print</b> button or hitting <b>SHIFT + ENTER</b> on your keyboard.

The Command Prompt is also capable interpreting commands and even supports a minimal procedural scripting language. Klick the <b>Exec</b> button or press <b>COMMAND + ENTER</b> to evaluate and run your program.

---

<b>Weather Board Commands</b>

You can just type a command in the Command Prompt and click <b>Exec</b> or press <b>COMMAND + ENTER</b> to execute.

<b>reset</b>
Reset all settings and return to default position

<b>restore</b>
Reset all settings but keep the cursor position.

<b>goto x y</b>
Move cursor to position and register as return position.

<b>move x y</b>
Move cursor relative to current position and register as return position.

<b>feed x y</b>
Change the direction the cursor advances during typing. Expecting x and y to be integers between -1 and 1.

<b>crlf</b>
Carriage return and line feed. Return to last registered position and adavance one line.

<b>cr</b>
Carriage return. Return to last registered position.

<b>fontsize f</b>
Change the fontsize. Expecting f to be an integer.

<b>print s</b>
Prints whatever passed as parameter s. Strings have to be quoted using <b>"</b>. Actually it is a macro that types multiple characters in series.

---

<b>Weather Board Script</b>

If you want to dive deeper you can write little programs using the proprietary scripting language. Only characters easy accessible on all devices are used. The language is imperative procedural and dynamically typed. It uses whitespace identation and a minimal set of control flow statements.

-

<b>Weather Board Script Types</b>

<b>String</b>
"Some String"

<b>Integer</b>
123

<b>Boolean</b>
true

<b>Identifier</b>
myVariable

-

<b>Weather Board operations</b>

<b>set a b</b>
Set the global variable a to the value of b. Expecting a to be an indetifier.

<b>read a [l]</b>
Read the character at the cursor position and write to the variable identified by a. The optional l parameter is expected to be a integer. 

<b>prepend a b</b>
Prepend string b to string a.

<b>append a b</b>
append string b to string a.

<b>add a b</b>
Add integer b to integer a.

<b>sub a b</b>
Subtract integer b from integer a

<b>mult a b</b>
Multiply integer a by integer b

<b>div a b</b>
Divide integer a by integer b.

-

<b>Weather Board conditionals</b>
Weather Board conditionals act like predefined if conditions without else clause. They also define code blocks and in combination with an repeat statement act like a while loop.

<b>eq a b</b>
Continue if a equals b.

<b>neq a b</b>
Continue if a does not equal b.

<b>lt a b</b>
Continue if a is less than b.

<b>lte a b</b>
Continue if a is less than or equals b.

<b>gt a b</b>
Continue if a is greater than b.

<b>gte a b</b>
Continue if a is greater than or equals b.

-

<b>Script Flow</b>

<b>proc n</b>
Define a procedure. Basically a code block with an optional global name.

<b>jump n</b>
Jump to a named procedure.

<b>wait n</b>
Wait for n seconds before continuing

<b>repeat n</b>
Repeat n times. If n is omitted it will repeat infinitlyl.

-

<b>Examples</b>

<b>return to origin</b>
goto 0 0

<b>move 10 left and 5 up</b>
move 10 -5

<b>double fontsize</b>
fontsize 36

<b>Reverse writing direction</b>
feed 0 -1

<b>99 Bottles of beer</b>
move 0 0
set beer 99
gt beer 0
  print beer
  print " bottles of beer on the wall,"
  crlf
  print beer
  print " bottles of beer!"
  crlf
  print "Take on down, pass it around"
  crlf
  set less beer
  sub less 1
  print less
  print " bottles of beer on the wall!"
  crlf
  sub beer 1
  crlf
  wait 500
  repeat

`

