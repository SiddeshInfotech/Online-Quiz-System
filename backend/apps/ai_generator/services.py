import os
import json
import re
import requests
import traceback
import unicodedata
import ast


class AIService:
    def __init__(self):
        self.api_key = os.environ.get('OPENROUTER_API_KEY')
        if not self.api_key:
            raise ValueError("OPENROUTER_API_KEY is not configured")

        self.api_url = "https://openrouter.ai/api/v1/chat/completions"
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

    def generate_quiz(self, subject, difficulty, num_questions, prompt_topic="", quiz_mode="Theory"):
        try:
            if quiz_mode == "Coding":
                return self._generate_coding_quiz(subject, difficulty, num_questions, prompt_topic)
            else:
                return self._generate_theory_quiz(subject, difficulty, num_questions, prompt_topic)
        except Exception as e:
            print(f"[WARNING] AI OpenRouter models failed ({e}), generating bulletproof fallback quiz...")
            return self._generate_fallback_quiz(subject, difficulty, num_questions, prompt_topic, quiz_mode)

    def _generate_fallback_quiz(self, subject, difficulty, num_questions, prompt_topic, quiz_mode):
        topic_title = prompt_topic.strip() if prompt_topic else "Core Principles"
        quiz_title = f"{subject}: {topic_title} Mastery"

        coding_pools = {
            "cpp": [
                {
                    "q": "What is the output of the following C++ code?\n\n```cpp\n#include <iostream>\nusing namespace std;\nint main() {\n    int a = 10;\n    int &b = a;\n    b = 20;\n    cout << a;\n    return 0;\n}\n```",
                    "opts": ["20", "10", "Garbage Value", "Compilation Error"],
                    "ans": "20"
                },
                {
                    "q": "What will the following C++ pointer code print?\n\n```cpp\n#include <iostream>\nusing namespace std;\nint main() {\n    int val = 50;\n    int *ptr = &val;\n    *ptr = 100;\n    cout << val;\n    return 0;\n}\n```",
                    "opts": ["100", "50", "0", "Memory Leak"],
                    "ans": "100"
                },
                {
                    "q": "What will be the output of this C++ function call?\n\n```cpp\n#include <iostream>\nusing namespace std;\nint calc(int x, int y = 5) {\n    return x * y;\n}\nint main() {\n    cout << calc(4);\n    return 0;\n}\n```",
                    "opts": ["20", "4", "9", "Compilation Error"],
                    "ans": "20"
                },
                {
                    "q": "What is the result of the following C++ vector operation?\n\n```cpp\n#include <iostream>\n#include <vector>\nusing namespace std;\nint main() {\n    vector<int> v = {10, 20, 30};\n    v.push_back(40);\n    v.pop_back();\n    cout << v.back();\n    return 0;\n}\n```",
                    "opts": ["30", "40", "20", "10"],
                    "ans": "30"
                },
                {
                    "q": "What will the following C++ global vs local scope snippet output?\n\n```cpp\n#include <iostream>\nusing namespace std;\nint num = 10;\nint main() {\n    int num = 5;\n    cout << ::num + num;\n    return 0;\n}\n```",
                    "opts": ["15", "10", "5", "Compilation Error"],
                    "ans": "15"
                },
                {
                    "q": "What will the following C++ ternary operator code print?\n\n```cpp\n#include <iostream>\nusing namespace std;\nint main() {\n    int a = 5;\n    int res = (a++ > 5) ? 10 : 20;\n    cout << res;\n    return 0;\n}\n```",
                    "opts": ["20", "10", "5", "6"],
                    "ans": "20"
                },
                {
                    "q": "What is the output of the following C++ lambda snippet?\n\n```cpp\n#include <iostream>\nusing namespace std;\nint main() {\n    auto square = [](int n) { return n * n; };\n    cout << square(6);\n    return 0;\n}\n```",
                    "opts": ["36", "12", "6", "Compilation Error"],
                    "ans": "36"
                },
                {
                    "q": "What will the following C++ string concatenation code output?\n\n```cpp\n#include <iostream>\n#include <string>\nusing namespace std;\nint main() {\n    string s1 = \"C++\";\n    string s2 = \"20\";\n    cout << (s1 + s2).length();\n    return 0;\n}\n```",
                    "opts": ["5", "3", "2", "6"],
                    "ans": "5"
                }
            ],
            "python": [
                {
                    "q": "What will be the output of the following Python list comprehension?\n\n```python\nitems = [1, 0, True, False, 2]\nresult = [x for x in items if x]\nprint(len(result))\n```",
                    "opts": ["3", "5", "2", "Error"],
                    "ans": "3"
                },
                {
                    "q": "What will the following Python dictionary get method output?\n\n```python\ndata = {\"a\": 1, \"b\": 2}\nprint(data.get(\"c\", 99))\n```",
                    "opts": ["99", "None", "KeyError", "2"],
                    "ans": "99"
                },
                {
                    "q": "What will the following Python slicing operation log?\n\n```python\ntext = \"Python\"\nprint(text[::-1])\n```",
                    "opts": ["\"nohtyP\"", "\"Python\"", "\"P\"", "\"n\""],
                    "ans": "\"nohtyP\""
                },
                {
                    "q": "What is the output of this Python generator expression?\n\n```python\ngen = (x * 2 for x in range(3))\nprint(list(gen))\n```",
                    "opts": ["[0, 2, 4]", "[2, 4, 6]", "(0, 2, 4)", "[0, 1, 2]"],
                    "ans": "[0, 2, 4]"
                },
                {
                    "q": "What will the following Python multiple assignment output?\n\n```python\na, b = 5, 10\na, b = b, a + b\nprint(a, b)\n```",
                    "opts": ["10 15", "5 15", "10 5", "15 10"],
                    "ans": "10 15"
                },
                {
                    "q": "What will the following Python args function output?\n\n```python\ndef total(*args):\n    return sum(args)\nprint(total(10, 20, 30))\n```",
                    "opts": ["60", "[10, 20, 30]", "10", "TypeError"],
                    "ans": "60"
                },
                {
                    "q": "What happens when executing this Python set operation?\n\n```python\ns1 = {1, 2, 3}\ns2 = {2, 3, 4}\nprint(s1 & s2)\n```",
                    "opts": ["{2, 3}", "{1, 2, 3, 4}", "{1, 4}", "SetError"],
                    "ans": "{2, 3}"
                },
                {
                    "q": "What is the output of this Python lambda map operation?\n\n```python\nnums = [1, 2, 3]\nres = list(map(lambda x: x + 10, nums))\nprint(res)\n```",
                    "opts": ["[11, 12, 13]", "[10, 20, 30]", "[1, 2, 3]", "Error"],
                    "ans": "[11, 12, 13]"
                }
            ],
            "java": [
                {
                    "q": "What is the output of the following Java string immutability code?\n\n```java\npublic class Main {\n    public static void main(String[] args) {\n        String str = \"Java\";\n        str.concat(\" SE\");\n        System.out.println(str);\n    }\n}\n```",
                    "opts": ["Java", "Java SE", "NullPointerException", "Compilation Error"],
                    "ans": "Java"
                },
                {
                    "q": "What will the following Java StringBuilder code output?\n\n```java\npublic class Main {\n    public static void main(String[] args) {\n        StringBuilder sb = new StringBuilder(\"Code\");\n        sb.append(\"123\");\n        System.out.println(sb.length());\n    }\n}\n```",
                    "opts": ["7", "4", "3", "Compilation Error"],
                    "ans": "7"
                },
                {
                    "q": "What will be printed by this Java array iteration snippet?\n\n```java\npublic class Main {\n    public static void main(String[] args) {\n        int[] arr = {2, 4, 6};\n        int sum = 0;\n        for(int x : arr) sum += x;\n        System.out.println(sum);\n    }\n}\n```",
                    "opts": ["12", "6", "3", "0"],
                    "ans": "12"
                },
                {
                    "q": "What is the output of this Java post-increment code?\n\n```java\npublic class Main {\n    public static void main(String[] args) {\n        int count = 5;\n        System.out.println(count++ + ++count);\n    }\n}\n```",
                    "opts": ["12", "11", "10", "13"],
                    "ans": "12"
                },
                {
                    "q": "What happens when running this Java ternary operator code?\n\n```java\npublic class Main {\n    public static void main(String[] args) {\n        boolean flag = false;\n        int val = flag ? 100 : 200;\n        System.out.println(val);\n    }\n}\n```",
                    "opts": ["200", "100", "0", "Compilation Error"],
                    "ans": "200"
                },
                {
                    "q": "What will the following Java Math function print?\n\n```java\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println(Math.max(15, 25));\n    }\n}\n```",
                    "opts": ["25", "15", "40", "0"],
                    "ans": "25"
                }
            ],
            "csharp": [
                {
                    "q": "What will be the output of the following C# post-increment snippet?\n\n```csharp\nusing System;\nclass Program {\n    static void Main() {\n        int x = 5;\n        Console.WriteLine(x++);\n    }\n}\n```",
                    "opts": ["5", "6", "4", "Compilation Error"],
                    "ans": "5"
                },
                {
                    "q": "What is the output of this C# string property snippet?\n\n```csharp\nusing System;\nclass Program {\n    static void Main() {\n        string text = \"C# .NET\";\n        Console.WriteLine(text.Length);\n    }\n}\n```",
                    "opts": ["7", "6", "8", "0"],
                    "ans": "7"
                },
                {
                    "q": "What will the following C# array code log?\n\n```csharp\nusing System;\nclass Program {\n    static void Main() {\n        int[] numbers = { 10, 20, 30 };\n        Console.WriteLine(numbers[1]);\n    }\n}\n```",
                    "opts": ["20", "10", "30", "IndexOutOfRangeException"],
                    "ans": "20"
                },
                {
                    "q": "What is the result of this C# nullable type snippet?\n\n```csharp\nusing System;\nclass Program {\n    static void Main() {\n        int? score = null;\n        Console.WriteLine(score ?? 100);\n    }\n}\n```",
                    "opts": ["100", "null", "0", "Compilation Error"],
                    "ans": "100"
                }
            ],
            "c": [
                {
                    "q": "What will be the output of the following C code?\n\n```c\n#include <stdio.h>\nint main() {\n    int a = 5;\n    printf(\"%d\", a++);\n    return 0;\n}\n```",
                    "opts": ["5", "6", "4", "Compilation Error"],
                    "ans": "5"
                },
                {
                    "q": "What will the following C pointer offset snippet print?\n\n```c\n#include <stdio.h>\nint main() {\n    int arr[3] = {10, 20, 30};\n    printf(\"%d\", *(arr + 1));\n    return 0;\n}\n```",
                    "opts": ["20", "10", "30", "Garbage Value"],
                    "ans": "20"
                },
                {
                    "q": "What is the output of this C bitwise shift operation?\n\n```c\n#include <stdio.h>\nint main() {\n    int val = 4;\n    printf(\"%d\", val << 2);\n    return 0;\n}\n```",
                    "opts": ["16", "8", "2", "4"],
                    "ans": "16"
                },
                {
                    "q": "What will the following C struct member access print?\n\n```c\n#include <stdio.h>\nstruct Point { int x; int y; };\nint main() {\n    struct Point p = {10, 25};\n    printf(\"%d\", p.y);\n    return 0;\n}\n```",
                    "opts": ["25", "10", "35", "0"],
                    "ans": "25"
                }
            ],
            "javascript": [
                {
                    "q": "What will the following JavaScript type coercion snippet output?\n\n```javascript\nconsole.log(1 + '2' + 3);\n```",
                    "opts": ["'123'", "6", "'15'", "NaN"],
                    "ans": "'123'"
                },
                {
                    "q": "What is the output of this JavaScript array map operation?\n\n```javascript\nconst arr = [1, 2, 3];\nconst res = arr.map(x => x * 2);\nconsole.log(res[1]);\n```",
                    "opts": ["4", "2", "6", "undefined"],
                    "ans": "4"
                },
                {
                    "q": "What will the following JavaScript variable hoisting snippet log?\n\n```javascript\nconsole.log(typeof a);\nvar a = 10;\n```",
                    "opts": ["\"undefined\"", "\"number\"", "\"ReferenceError\"", "\"object\""],
                    "ans": "\"undefined\""
                },
                {
                    "q": "What is the output of this JavaScript filter snippet?\n\n```javascript\nconst items = [0, 'hello', false, 42];\nconsole.log(items.filter(Boolean).length);\n```",
                    "opts": ["2", "4", "1", "3"],
                    "ans": "2"
                }
            ],
            "react": [
                {
                    "q": "What will the following React JSX component render?\n\n```jsx\nfunction Component() {\n  const [count] = useState(0);\n  return <button>{count}</button>;\n}\n```",
                    "opts": ["A button displaying 0", "A button displaying null", "Syntax Error", "A button displaying 1"],
                    "ans": "A button displaying 0"
                },
                {
                    "q": "What will this React props rendering component log?\n\n```jsx\nfunction Welcome({ name = \"Guest\" }) {\n  return <h1>Hello {name}</h1>;\n}\n// Rendered as: <Welcome />\n```",
                    "opts": ["\"Hello Guest\"", "\"Hello undefined\"", "\"Hello \"", "Error"],
                    "ans": "\"Hello Guest\""
                },
                {
                    "q": "What happens when rendering this React conditional JSX?\n\n```jsx\nfunction Status({ isOnline }) {\n  return <div>{isOnline ? \"Active\" : \"Offline\"}</div>;\n}\n// Rendered as: <Status isOnline={true} />\n```",
                    "opts": ["Renders \"Active\"", "Renders \"Offline\"", "Renders true", "Error"],
                    "ans": "Renders \"Active\""
                }
            ],
            "typescript": [
                {
                    "q": "What is the output of the following TypeScript snippet?\n\n```typescript\nlet num: number = 10;\nlet val: any = num;\nconsole.log(typeof val);\n```",
                    "opts": ["\"number\"", "\"any\"", "\"object\"", "\"undefined\""],
                    "ans": "\"number\""
                },
                {
                    "q": "What will the following TypeScript optional property snippet output?\n\n```typescript\ninterface User { name: string; age?: number; }\nconst u: User = { name: \"Alice\" };\nconsole.log(u.age);\n```",
                    "opts": ["undefined", "null", "0", "Compilation Error"],
                    "ans": "undefined"
                }
            ],
            "rust": [
                {
                    "q": "What will be the output of this Rust mutable variable snippet?\n\n```rust\nfn main() {\n    let mut x = 5;\n    x += 1;\n    println!(\"{}\", x);\n}\n```",
                    "opts": ["6", "5", "Compilation Error", "Garbage Value"],
                    "ans": "6"
                },
                {
                    "q": "What happens when compiling this Rust move semantics snippet?\n\n```rust\nfn main() {\n    let s1 = String::from(\"hello\");\n    let s2 = s1;\n    println!(\"{}\", s2.len());\n}\n```",
                    "opts": ["5", "Compilation Error", "Undefined Behavior", "0"],
                    "ans": "5"
                }
            ]
        }

        theory_pools = {
            "cpp": [
                {
                    "q": "Which feature of C++ allows multiple functions in the same scope to share the same name with different parameter lists?",
                    "opts": ["Function Overloading", "Function Overriding", "Virtual Functions", "Templates"],
                    "ans": "Function Overloading"
                },
                {
                    "q": "In C++, what keyword is used to declare a pure virtual function in an abstract base class?",
                    "opts": ["= 0 syntax at function declaration", "pure keyword", "abstract keyword", "virtual final keyword"],
                    "ans": "= 0 syntax at function declaration"
                },
                {
                    "q": "What is the primary advantage of passing large objects by reference (`const T&`) in C++?",
                    "opts": ["Prevents expensive deep copies while protecting data integrity", "Increases pointer conversion speed", "Allows automatic garbage collection", "Converts objects to primitive types"],
                    "ans": "Prevents expensive deep copies while protecting data integrity"
                },
                {
                    "q": "Which C++ standard container provides constant time O(1) random access by index?",
                    "opts": ["std::vector", "std::list", "std::map", "std::set"],
                    "ans": "std::vector"
                },
                {
                    "q": "In C++, what happens when a class destructor is NOT declared as `virtual` in a base class?",
                    "opts": ["Deleting a derived class object through a base pointer causes undefined behavior / resource leaks", "The program fails to compile", "Base class memory is corrupted", "Virtual table is disabled"],
                    "ans": "Deleting a derived class object through a base pointer causes undefined behavior / resource leaks"
                },
                {
                    "q": "What is RAII (Resource Acquisition Is Initialization) in C++?",
                    "opts": ["A design pattern where resource lifecycle is bound to object lifetime via constructors/destructors", "A method for dynamic memory allocation", "An API for multithreading", "A compiler flag for performance"],
                    "ans": "A design pattern where resource lifecycle is bound to object lifetime via constructors/destructors"
                },
                {
                    "q": "Which smart pointer in C++11 enforces single, unshared ownership of a dynamic resource?",
                    "opts": ["std::unique_ptr", "std::shared_ptr", "std::weak_ptr", "std::auto_ptr"],
                    "ans": "std::unique_ptr"
                },
                {
                    "q": "What is the difference between `new` operator and `malloc()` in C++?",
                    "opts": ["`new` calls class constructors and returns typed pointers, whereas `malloc()` only allocates raw bytes", "`malloc()` calls constructors while `new` does not", "`new` is deprecated in C++17", "They perform identical low-level instructions"],
                    "ans": "`new` calls class constructors and returns typed pointers, whereas `malloc()` only allocates raw bytes"
                }
            ],
            "python": [
                {
                    "q": "What is the fundamental difference between a List and a Tuple in Python?",
                    "opts": ["Lists are mutable objects while Tuples are immutable", "Tuples are mutable objects while Lists are immutable", "Lists cannot hold nested data", "Tuples do not support indexing"],
                    "ans": "Lists are mutable objects while Tuples are immutable"
                },
                {
                    "q": "What is the purpose of the `yield` keyword in a Python function?",
                    "opts": ["Turns the function into a Generator that produces a stream of values lazily", "Terminates the program execution", "Imports external modules asynchronously", "Raises a runtime exception"],
                    "ans": "Turns the function into a Generator that produces a stream of values lazily"
                },
                {
                    "q": "In Python, what does the Global Interpreter Lock (GIL) enforce?",
                    "opts": ["Ensures only one thread executes Python bytecode at a time per process", "Limits maximum memory allocation", "Prevents file system access", "Enforces static type checking"],
                    "ans": "Ensures only one thread executes Python bytecode at a time per process"
                },
                {
                    "q": "What is the difference between `is` and `==` in Python?",
                    "opts": ["`is` checks memory identity, while `==` checks value equality", "`==` checks memory identity, while `is` checks value equality", "They are identical aliases", "`is` only operates on strings"],
                    "ans": "`is` checks memory identity, while `==` checks value equality"
                },
                {
                    "q": "What does a Python Decorator function do?",
                    "opts": ["Takes another function as an argument and extends its behavior without modifying it directly", "Renders HTML templates in Flask", "Compiles Python bytecode to C", "Cleans garbage memory"],
                    "ans": "Takes another function as an argument and extends its behavior without modifying it directly"
                },
                {
                    "q": "Which built-in Python function creates a shallow copy of a dictionary `d`?",
                    "opts": ["d.copy()", "d.clone()", "copy(d)", "d.duplicate()"],
                    "ans": "d.copy()"
                },
                {
                    "q": "What is the time complexity of looking up a key in a Python `dict` on average?",
                    "opts": ["O(1) Constant Time", "O(N) Linear Time", "O(log N) Logarithmic Time", "O(N^2) Quadratic Time"],
                    "ans": "O(1) Constant Time"
                },
                {
                    "q": "In Python, what special method is invoked when evaluating `str(obj)`?",
                    "opts": ["__str__()", "__repr__()", "__init__()", "__unicode__()"],
                    "ans": "__str__()"
                }
            ],
            "java": [
                {
                    "q": "Which keyword prevents a Java class from being inherited or subclassed?",
                    "opts": ["final", "static", "private", "abstract"],
                    "ans": "final"
                },
                {
                    "q": "What is the default initial memory state of an uninitialized instance object reference in Java?",
                    "opts": ["null", "0", "undefined", "garbage value"],
                    "ans": "null"
                },
                {
                    "q": "In Java, what is the main distinction between an Interface and an Abstract Class?",
                    "opts": ["A class can implement multiple Interfaces but extend only one Abstract Class", "Interfaces can contain stateful instance fields", "Abstract classes cannot have method implementations", "Interfaces require public constructors"],
                    "ans": "A class can implement multiple Interfaces but extend only one Abstract Class"
                },
                {
                    "q": "Which Java collection class guarantees unique elements and maintains insertion order?",
                    "opts": ["LinkedHashSet", "HashSet", "ArrayList", "TreeSet"],
                    "ans": "LinkedHashSet"
                },
                {
                    "q": "What happens if a `finally` block is attached to a `try-catch` structure in Java?",
                    "opts": ["The `finally` block executes regardless of whether an exception is thrown or caught", "It executes only if an uncaught exception occurs", "It executes only when no exception occurs", "It cancels exception propagation"],
                    "ans": "The `finally` block executes regardless of whether an exception is thrown or caught"
                }
            ],
            "csharp": [
                {
                    "q": "Which C# modifier prevents a class from being inherited by other classes?",
                    "opts": ["sealed", "static", "final", "abstract"],
                    "ans": "sealed"
                },
                {
                    "q": "What is the primary difference between a `struct` and a `class` in C#?",
                    "opts": ["`struct` is a value type stored on the stack/inline, while `class` is a reference type on the heap", "`class` is a value type while `struct` is a reference type", "`struct` cannot have methods", "They are identical in .NET"],
                    "ans": "`struct` is a value type stored on the stack/inline, while `class` is a reference type on the heap"
                },
                {
                    "q": "What does the LINQ `FirstOrDefault()` method return if no element satisfies the condition?",
                    "opts": ["The default value for the type (e.g. null for reference types, 0 for ints)", "Throws an InvalidOperationException", "Returns an empty IEnumerable", "Returns false"],
                    "ans": "The default value for the type (e.g. null for reference types, 0 for ints)"
                }
            ],
            "react": [
                {
                    "q": "What is Virtual DOM in React?",
                    "opts": ["In-memory lightweight representation of the real DOM used for efficient reconciliation", "A physical browser popup window", "A server-side database cache", "A WebGL rendering library"],
                    "ans": "In-memory lightweight representation of the real DOM used for efficient reconciliation"
                },
                {
                    "q": "Why should React component state NEVER be mutated directly (`this.state.count = 5`)?",
                    "opts": ["Direct mutations do not trigger a component re-render in React", "It causes a immediate browser crash", "It deletes component props", "React throws a syntax error"],
                    "ans": "Direct mutations do not trigger a component re-render in React"
                },
                {
                    "q": "In React `useEffect`, what does an empty dependency array `[]` signify?",
                    "opts": ["The effect callback executes exactly once after the initial component mount", "The effect executes on every re-render", "The effect is disabled", "The component unmounts immediately"],
                    "ans": "The effect callback executes exactly once after the initial component mount"
                }
            ],
            "javascript": [
                {
                    "q": "What is the difference between '==' and '===' in JavaScript?",
                    "opts": ["'===' checks both value and type without coercion, while '==' performs implicit type coercion", "'==' checks value and type, while '===' performs coercion", "They are identical in ES6", "'===' only works on numbers"],
                    "ans": "'===' checks both value and type without coercion, while '==' performs implicit type coercion"
                },
                {
                    "q": "What is a Closure in JavaScript?",
                    "opts": ["A function bundled together with references to its surrounding lexical environment", "A method for closing browser tabs", "A private class constructor", "A database disconnect function"],
                    "ans": "A function bundled together with references to its surrounding lexical environment"
                },
                {
                    "q": "What will `typeof NaN` evaluate to in JavaScript?",
                    "opts": ["\"number\"", "\"NaN\"", "\"undefined\"", "\"object\""],
                    "ans": "\"number\""
                }
            ],
            "c": [
                {
                    "q": "Which standard library function in C allocates dynamic memory and initializes all bytes to zero?",
                    "opts": ["calloc()", "malloc()", "realloc()", "free()"],
                    "ans": "calloc()"
                },
                {
                    "q": "In C programming, what is a Dangling Pointer?",
                    "opts": ["A pointer that continues to reference a memory address that has already been deallocated", "A NULL pointer", "An uninitialized local variable", "A pointer pointing to a static function"],
                    "ans": "A pointer that continues to reference a memory address that has already been deallocated"
                }
            ]
        }

        # ✅ Comprehensive Subject Classifier
        subj_lower = subject.lower().strip()
        if "c#" in subj_lower or "csharp" in subj_lower or "c sharp" in subj_lower or subj_lower == "cs":
            subj_key = "csharp"
        elif "typescript" in subj_lower or "ts" in subj_lower:
            subj_key = "typescript"
        elif "node" in subj_lower:
            subj_key = "nodejs"
        elif "react" in subj_lower:
            subj_key = "react"
        elif "flask" in subj_lower:
            subj_key = "flask"
        elif "django" in subj_lower:
            subj_key = "django"
        elif "rust" in subj_lower:
            subj_key = "rust"
        elif "c++" in subj_lower or "cpp" in subj_lower:
            subj_key = "cpp"
        elif subj_lower in ["c", "c programming", "c language"] or (subj_lower.startswith("c ") and "++" not in subj_lower and "#" not in subj_lower):
            subj_key = "c"
        elif "java" in subj_lower and "script" not in subj_lower:
            subj_key = "java"
        elif "script" in subj_lower or "js" in subj_lower:
            subj_key = "javascript"
        elif "python" in subj_lower or "py" in subj_lower:
            subj_key = "python"
        else:
            subj_key = subj_lower

        target_pools = coding_pools if quiz_mode == "Coding" else theory_pools
        pool = target_pools.get(subj_key, [])

        questions = []
        seen_texts = set()
        idx = 0

        # Sub-topic generators for 100% unique question generation beyond static pool
        subtopics_coding = [
            ("Variables & Data Types", lambda v, s: (f"What is the output of the following {subject} snippet (Var #{v})?\n\n```{s}\nint val{v} = {v * 5};\nval{v} += 10;\ncout << val{v};\n```" if s in ["cpp", "c"] else f"What is the output of the following {subject} code (Var #{v})?\n\n```{s}\nval{v} = {v * 5}\nval{v} += 10\nprint(val{v})\n```", [str(v * 5 + 10), str(v * 5), str(v * 10), "Error"], str(v * 5 + 10))),
            ("Conditionals & Logic", lambda v, s: (f"What will this {subject} condition evaluate to (Check #{v})?\n\n```{s}\nint score{v} = {v * 15};\nif (score{v} >= 30) {{\n    cout << \"Pass\";\n}} else {{\n    cout << \"Fail\";\n}}\n```" if s in ["cpp", "c"] else f"What will this {subject} code output (Check #{v})?\n\n```{s}\nscore{v} = {v * 15}\nprint(\"Pass\" if score{v} >= 30 else \"Fail\")\n```", ["Pass" if v * 15 >= 30 else "Fail", "Fail" if v * 15 >= 30 else "Pass", "Error", "None"], "Pass" if v * 15 >= 30 else "Fail")),
            ("Loop Execution", lambda v, s: (f"What total count does this {subject} loop produce (Loop #{v})?\n\n```{s}\nint total{v} = 0;\nfor (int i = 0; i < {v}; i++) {{\n    total{v} += i;\n}}\ncout << total{v};\n```" if s in ["cpp", "c"] else f"What does this {subject} loop calculate (Loop #{v})?\n\n```{s}\ntotal{v} = sum(range({v}))\nprint(total{v})\n```", [str(sum(range(v))), str(v * v), str(v), "0"], str(sum(range(v))))),
            ("Array / List Processing", lambda v, s: (f"What element is printed by this {subject} array code (Array #{v})?\n\n```{s}\nint arr{v}[] = {{{v * 2}, {v * 3}, {v * 4}}};\ncout << arr{v}[1];\n```" if s in ["cpp", "c"] else f"What element does this {subject} list access (List #{v})?\n\n```{s}\nitems{v} = [{v * 2}, {v * 3}, {v * 4}]\nprint(items{v}[1])\n```", [str(v * 3), str(v * 2), str(v * 4), "IndexError"], str(v * 3))),
            ("Function Mechanics", lambda v, s: (f"What is returned by this {subject} helper function (Fn #{v})?\n\n```{s}\nint multiply{v}(int a, int b) {{\n    return a * b + {v};\n}}\n// Called as: multiply{v}(3, 4)\n```" if s in ["cpp", "c"] else f"What is the result of calling this {subject} function (Fn #{v})?\n\n```{s}\ndef compute{v}(a, b):\n    return a * b + {v}\nprint(compute{v}(3, 4))\n```", [str(12 + v), str(12), str(7 + v), "0"], str(12 + v))),
            ("String Manipulation", lambda v, s: (f"What is printed by this {subject} string operation (Str #{v})?\n\n```{s}\nstring s{v} = \"Tech{v}\";\ncout << s{v}.length();\n```" if s in ["cpp", "c"] else f"What is the output of this {subject} string method (Str #{v})?\n\n```{s}\ns{v} = \"Code{v}\"\nprint(len(s{v}))\n```", [str(4 + len(str(v))), str(4), str(len(str(v))), "Error"], str(4 + len(str(v)))))
        ]

        subtopics_theory = [
            ("Core Paradigm", f"What is the fundamental architectural philosophy of {subject}?", ["Structured modular design with high reusability", "Single-threaded synchronous blocking execution", "Direct binary patch assembly", "Pure procedural memory mapping"], "Structured modular design with high reusability"),
            ("Memory Model", f"How does {subject} manage runtime memory allocation and lifecycle?", ["Allocates memory dynamically via runtime stack/heap primitives", "Uses fixed physical disk caching", "Requires manual register manipulation", "Does not allocate memory"], "Allocates memory dynamically via runtime stack/heap primitives"),
            ("Type System", f"Which type system design feature applies directly to {subject}?", ["Enforces clear type rules for variable safety and evaluation", "Disallows function definitions", "Requires all variables to be string types", "Does not support primitive types"], "Enforces clear type rules for variable safety and evaluation"),
            ("Scope & Visibility", f"How are identifiers and variables scoped in {subject}?", ["Scoped lexically within block, function, or namespace boundaries", "Global visibility for all local variables", "Randomized pointer scope", "Class-only scope"], "Scoped lexically within block, function, or namespace boundaries"),
            ("Error Handling", f"What mechanism is standard for handling runtime exceptions in {subject}?", ["Try-Catch exception blocks and error status return codes", "Immediate OS kernel halt", "Ignoring invalid operations", "Syntax re-compilation"], "Try-Catch exception blocks and error status return codes"),
            ("Performance Optimization", f"Which practice improves execution efficiency in {subject}?", ["Using appropriate data structures and minimizing redundant operations", "Inserting infinite loops", "Avoiding function calls entirely", "Storing all data on disk"], "Using appropriate data structures and minimizing redundant operations")
        ]

        while len(questions) < num_questions:
            if idx < len(pool):
                item = pool[idx]
            else:
                var_num = idx + 1
                if quiz_mode == "Coding":
                    topic_name, gen_fn = subtopics_coding[(idx - len(pool)) % len(subtopics_coding)]
                    q_text, opts, ans = gen_fn(var_num, subj_key)
                    item = {"q": q_text, "opts": opts, "ans": ans}
                else:
                    topic_title_sub, q_stem, opts, ans = subtopics_theory[(idx - len(pool)) % len(subtopics_theory)]
                    item = {
                        "q": f"Regarding {subject} {topic_title_sub} (Topic #{var_num}): {q_stem}",
                        "opts": list(opts),
                        "ans": ans
                    }

            idx += 1
            if item["q"] not in seen_texts:
                seen_texts.add(item["q"])
                questions.append({
                    "question_type": "Coding" if quiz_mode == "Coding" else "MCQ",
                    "question_text": item["q"],
                    "options": list(item["opts"]),
                    "correct_answer": item["ans"]
                })

        return {
            "quiz_title": quiz_title,
            "questions": questions
        }

    def _generate_theory_quiz(self, subject, difficulty, num_questions, prompt_topic):
        prompt = f"""
You are an expert quiz generator. Generate exactly {num_questions} 100% UNIQUE theory questions on "{subject}".

Difficulty: {difficulty}
Focus: {prompt_topic if prompt_topic else 'General'}

CRITICAL STRICT RULES:
1. SUBJECT MATCHING: All questions MUST be 100% focused on "{subject}". Do NOT generate questions about Python if the subject is "{subject}".
2. ZERO DUPLICATES (MANDATORY): Every single question in the returned array MUST be completely unique. Ensure each question tests a DISTINCT and DIFFERENT sub-topic or concept. If generating {num_questions} questions, they must cover {num_questions} completely DIFFERENT concepts. Do NOT repeat the same question or options.

TITLE GENERATION RULE:
Generate a short, catchy, and highly unique title for this quiz by combining the Subject ("{subject}") and the Focus/Topic ("{prompt_topic if prompt_topic else 'General'}").

QUESTION TYPES (mix them evenly):
1. MCQ (Multiple Choice) - 4 options, one correct.
2. True/False - exactly 4 options where Option A="True", Option B="False", C & D are meaningful alternatives.
3. Fill in the Blank - statement with a missing word.

OUTPUT - Return a JSON object with two fields: "quiz_title" and "questions" (array of exactly {num_questions} unique questions):
{{
  "quiz_title": "{subject}: {prompt_topic if prompt_topic else 'Core'} Combat",
  "questions": [
    {{
      "question_type": "MCQ",
      "question_text": "Question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": "Option A"
    }}
  ]
}}

Return ONLY valid JSON. No extra text.
"""
        return self._call_openrouter(prompt, num_questions)

    def _generate_coding_quiz(self, subject, difficulty, num_questions, prompt_topic):
        prompt = f"""
You are an expert programming logic question generator. Generate exactly {num_questions} 100% UNIQUE programming questions specifically for "{subject}".

Difficulty: {difficulty}
Focus: {prompt_topic if prompt_topic else 'General'}

CRITICAL STRICT RULES:
1. SUBJECT LANGUAGE MATCHING: Every code snippet MUST be written in valid {subject} syntax inside a markdown code block tagged ```{subject.lower()}. NEVER output Python code when the subject is "{subject}".
2. ZERO DUPLICATES (MANDATORY): Every single question MUST be unique. Do not repeat code snippets or question text. Each snippet must test a completely DIFFERENT concept, function, or logic flaw.
3. OPTIONS MATCH CODE: The 4 options MUST be the exact outputs or values produced by running that specific code snippet.

TITLE GENERATION RULE:
Generate a short, catchy title combining Subject ("{subject}") and Topic ("{prompt_topic if prompt_topic else 'General'}").

OUTPUT FORMAT (JSON object with "quiz_title" and "questions"):
{{
  "quiz_title": "{subject} Logic Combat",
  "questions": [
    {{
      "question_type": "Coding",
      "question_text": "What is the output of the following {subject} code?\\n\\n```{subject.lower()}\\n// code snippet in {subject}\\n```",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "correct_answer": "Option 1"
    }}
  ]
}}

Return ONLY valid JSON.
"""
        return self._call_openrouter(prompt, num_questions)

    def _clean_json_strings(self, text):
        """Escapes raw unescaped newlines, carriage returns, and tabs inside JSON string values."""
        result = []
        in_string = False
        escaped = False
        for char in text:
            if char == '"' and not escaped:
                in_string = not in_string
                result.append(char)
            elif in_string:
                if char == '\n':
                    result.append('\\n')
                elif char == '\r':
                    result.append('\\r')
                elif char == '\t':
                    result.append('\\t')
                else:
                    result.append(char)
            else:
                result.append(char)
            escaped = (char == '\\' and not escaped)
        return "".join(result)

    def _fix_truncated_json(self, text):
        """Attempts to close unclosed JSON quotes, objects, and arrays if truncated."""
        if not text:
            return text
        
        # Balance quotes if odd number of unescaped quotes
        if text.count('"') % 2 != 0:
            text += '"'

        stack = []
        in_str = False
        escaped = False
        for char in text:
            if char == '"' and not escaped:
                in_str = not in_str
            elif not in_str:
                if char in '{[':
                    stack.append(char)
                elif char in '}]':
                    if stack and ((char == '}' and stack[-1] == '{') or (char == ']' and stack[-1] == '[')):
                        stack.pop()
            escaped = (char == '\\' and not escaped)

        while stack:
            opener = stack.pop()
            text += '}' if opener == '{' else ']'
            
        return text

    def _parse_json_robustly(self, raw_text):
        if not raw_text or not raw_text.strip():
            raise ValueError("Empty output from AI model")

        text = raw_text.strip()

        # 1. Remove markdown fences
        code_block = re.search(r'```(?:json)?\s*(.*?)\s*```', text, re.DOTALL)
        if code_block:
            text = code_block.group(1).strip()

        # 2. Try direct json.loads
        try:
            return json.loads(text, strict=False)
        except Exception:
            pass

        # 3. Clean raw unescaped string control characters & truncated JSON
        cleaned_text = self._clean_json_strings(text)
        try:
            return json.loads(cleaned_text, strict=False)
        except Exception:
            pass

        fixed_truncated = self._fix_truncated_json(cleaned_text)
        try:
            return json.loads(fixed_truncated, strict=False)
        except Exception:
            pass

        # 4. Extract JSON object or array bounds
        start_obj = text.find('{')
        end_obj = text.rfind('}')
        start_arr = text.find('[')
        end_arr = text.rfind(']')

        candidates = []
        if start_obj != -1 and end_obj != -1 and end_obj > start_obj:
            candidates.append(text[start_obj:end_obj + 1])
            candidates.append(self._clean_json_strings(text[start_obj:end_obj + 1]))
            candidates.append(self._fix_truncated_json(text[start_obj:end_obj + 1]))
        if start_arr != -1 and end_arr != -1 and end_arr > start_arr:
            candidates.append(text[start_arr:end_arr + 1])
            candidates.append(self._clean_json_strings(text[start_arr:end_arr + 1]))
            candidates.append(self._fix_truncated_json(text[start_arr:end_arr + 1]))
        candidates.append(text)
        candidates.append(cleaned_text)
        candidates.append(fixed_truncated)

        for candidate in candidates:
            # Try simple candidate load
            try:
                return json.loads(candidate, strict=False)
            except Exception:
                pass

            # Fix common JSON errors:
            # a) Trailing commas
            c1 = re.sub(r',\s*([\}\]])', r'\1', candidate)
            try:
                return json.loads(c1, strict=False)
            except Exception:
                pass

            # b) Unquoted keys: { quiz_title: "..." } -> { "quiz_title": "..." }
            c2 = re.sub(r'([{,]\s*)([a-zA-Z0-9_]+)\s*:', r'\1"\2":', c1)
            try:
                return json.loads(c2, strict=False)
            except Exception:
                pass

            # c) Single quotes for strings
            c3 = re.sub(r"(?<=[:\[,\{])\s*'([^'\\]*(?:\\.[^'\\]*)*)'\s*(?=[,\}\]])", r' "\1"', c2)
            try:
                return json.loads(c3, strict=False)
            except Exception:
                pass

            # d) ast.literal_eval
            try:
                return ast.literal_eval(candidate)
            except Exception:
                pass
            try:
                return ast.literal_eval(c3)
            except Exception:
                pass

        raise ValueError("Failed to parse valid JSON from model output")

    def _call_openrouter(self, prompt, num_questions):
        models_to_try = [
            "google/gemini-2.0-flash-001",
            "meta-llama/llama-3.3-70b-instruct:free",
            "google/gemini-2.0-flash-lite-001",
            "openai/gpt-4o-mini"
        ]

        last_error = None

        for model in models_to_try:
            try:
                payload = {
                    "model": model,
                    "messages": [
                        {
                            "role": "system",
                            "content": "You are an expert quiz generation engine. You MUST respond with 100% valid JSON only, with double quotes around all object property names and string values. DO NOT include choice letter prefixes like 'A.', 'B.', 'C.', 'D.' or '1.' inside the option text strings; output raw option text values only. Do not include any conversational response."
                        },
                        {"role": "user", "content": prompt}
                    ],
                    "response_format": {"type": "json_object"},
                    "temperature": 0.9,
                    "max_tokens": 4000,
                }

                response = requests.post(
                    self.api_url,
                    headers=self.headers,
                    json=payload,
                    timeout=12,
                    stream=False
                )

                # Fallback if model doesn't support response_format
                if response.status_code == 400 and 'response_format' in response.text:
                    payload.pop('response_format', None)
                    response = requests.post(
                        self.api_url,
                        headers=self.headers,
                        json=payload,
                        timeout=12,
                        stream=False
                    )

                if response.status_code == 200:
                    data = response.json()
                    raw_text = data['choices'][0]['message']['content'].strip()
                else:
                    raise ValueError(f"OpenRouter status {response.status_code}: {response.text}")

                # Clean and parse the raw output using robust parsing strategies
                parsed_data = self._parse_json_robustly(raw_text)

                quiz_title = ""
                if isinstance(parsed_data, dict):
                    quiz_title = parsed_data.get('quiz_title', '').strip()
                    questions = parsed_data.get('questions', [])
                else:
                    questions = parsed_data

                if not isinstance(questions, list):
                    raise ValueError("Response is not a list")

                # Bulletproof deduplication check
                unique_questions = []
                seen_q_texts = set()
                for q in questions:
                    q_text = str(q.get('question_text', '')).strip().lower()
                    if q_text and q_text not in seen_q_texts:
                        seen_q_texts.add(q_text)
                        unique_questions.append(q)
                
                questions = unique_questions

                # Force retry if the model ignored our uniqueness instructions entirely
                if len(questions) < max(1, num_questions // 2):
                    raise ValueError(f"Model generated too many duplicates. Only {len(questions)} unique questions found out of {num_questions} requested.")

                random_patterns = ['pizza', 'burger', 'cake', 'dog', 'cat', 'apple', 'banana', 'sandwich']
                sensible_alternatives = [
                    "True, but only under certain conditions",
                    "False, except in specific cases",
                    "Partially true",
                    "Not applicable in this context",
                    "Both A and B"
                ]

                for q in questions:
                    q_type = q.get('question_type', '')
                    options = q.get('options', [])
                    correct = q.get('correct_answer', '')

                    if q_type in ['MCQ', 'True/False', 'Fill in the Blank', 'Coding']:
                        if not isinstance(options, list):
                            options = []

                        # Gracefully ensure exactly 4 options
                        if len(options) < 4:
                            while len(options) < 4:
                                options.append(sensible_alternatives[len(options) - 2] if len(options) - 2 < len(sensible_alternatives) else f"Option {len(options) + 1}")
                        elif len(options) > 4:
                            options = options[:4]

                        if q_type == 'True/False':
                            if len(options) >= 2:
                                options[0] = "True"
                                options[1] = "False"

                            for i in range(2, len(options)):
                                opt_lower = options[i].lower()
                                if len(options[i]) < 3 or any(word in opt_lower for word in random_patterns):
                                    options[i] = sensible_alternatives[i - 2] if i - 2 < len(sensible_alternatives) else "None of the above"

                            if correct not in ["True", "False"]:
                                if correct in ["A", "True"]:
                                    q['correct_answer'] = "True"
                                elif correct in ["B", "False"]:
                                    q['correct_answer'] = "False"
                                else:
                                    q['correct_answer'] = "True"

                            q['options'] = options

                        correct = q.get('correct_answer', '')
                        if correct not in options:
                            if correct in ['A', 'B', 'C', 'D']:
                                label_map = {'A': 0, 'B': 1, 'C': 2, 'D': 3}
                                idx = label_map.get(correct, 0)
                                if idx < len(options):
                                    q['correct_answer'] = options[idx]
                            else:
                                q['correct_answer'] = options[0] if options else ""

                return {
                    "quiz_title": quiz_title,
                    "questions": questions
                }

            except requests.exceptions.RequestException as e:
                last_error = f"{model} request error: {str(e)}"
            except json.JSONDecodeError as e:
                last_error = f"{model} JSON decode error: {str(e)}"
            except Exception as e:
                last_error = f"{model} error: {str(e)}"

        raise ValueError(f"All AI models failed. Last error: {last_error}")

    def call_openrouter(self, prompt, num_items):
        """Public wrapper for OpenRouter API calls."""
        return self._call_openrouter(prompt, num_items)

    def generate_explanations(self, prompt, num_items):
        """
        Generate AI explanations (list of strings) using OpenRouter.
        This is a simpler version that doesn't validate question structure.
        """
        models_to_try = [
            "google/gemini-2.0-flash-001",
            "meta-llama/llama-3.3-70b-instruct:free",
            "openai/gpt-4o-mini"
        ]

        last_error = None

        for model in models_to_try:
            try:
                payload = {
                    "model": model,
                    "messages": [
                        {
                            "role": "system",
                            "content": "You are an AI explanation engine. Respond ONLY with a valid JSON object containing an 'explanations' key mapped to an array of explanation strings. Example: {\"explanations\": [\"exp1\", \"exp2\"]}"
                        },
                        {"role": "user", "content": prompt}
                    ],
                    "response_format": {"type": "json_object"},
                    "temperature": 0.8,
                    "max_tokens": 2000,
                }

                response = requests.post(
                    self.api_url,
                    headers=self.headers,
                    json=payload,
                    timeout=25,
                    stream=False
                )

                if response.status_code == 200:
                    data = response.json()
                    raw_text = data['choices'][0]['message']['content'].strip()
                else:
                    raise ValueError(f"{model} failed with status {response.status_code}")

                # Clean and parse JSON
                parsed_data = self._parse_json_robustly(raw_text)

                if isinstance(parsed_data, dict):
                    explanations = parsed_data.get('explanations', [])
                else:
                    explanations = parsed_data

                # Normalize to expected length and list type
                if not isinstance(explanations, list):
                    explanations = []

                if len(explanations) < num_items:
                    while len(explanations) < num_items:
                        explanations.append("No explanation available.")
                elif len(explanations) > num_items:
                    explanations = explanations[:num_items]

                return explanations

            except Exception as e:
                last_error = f"{model} error: {str(e)}"
                print(f"Warning: {last_error}, trying next model...")

        raise ValueError(f"All AI models failed. Last error: {last_error}")