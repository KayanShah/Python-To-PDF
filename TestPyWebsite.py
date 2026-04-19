# keyword colours test
False; None; True
and; as; assert; async; await
break; class; continue; def; del
elif; else; except; finally; for
from; global; if; import; in; is
lambda; nonlocal; not; or; pass
raise; return; try; while; with; yield

# builtin colours test
print(len(range(10)))
x = int(input("n: "))
isinstance(x, float)
sorted(reversed([1,2,3]))

# string test
a = "double"
b = 'single'
c = f"formatted {x}"
d = """triple double"""
e = r"\raw"
f_ = b"bytes"

# comment test — this whole line is red

# defname test
def my_function():
    pass

class MyClass:
    pass

# number test
n1 = 42
n2 = 3.14
n3 = 0xFF
n4 = 0b1010
n5 = 1_000_000
n6 = 3j
