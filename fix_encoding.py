"""Fix encoding corruption in nexusmon_server.py.

Replaces garbled em-dash sequences (Windows-1252 double-encoded into UTF-8)
with proper UTF-8 em-dash / en-dash characters.

Also strips BOM if present.
"""
import sys

TARGET = r'e:\NEXUSMON-main\NEXUSMON-main-backup-20260227-224154\nexusmon_server.py'

with open(TARGET, 'rb') as f:
    content = f.read()

original_len = len(content)

# Strip BOM if present
if content.startswith(b'\xef\xbb\xbf'):
    content = content[3:]
    print("Stripped BOM")

replacements = [
    # â€" → — (em-dash, most common variant with trailing ASCII quote)
    (b'\xc3\xa2\xe2\x82\xac\x22', b'\xe2\x80\x94'),
    # â€" → — (em-dash, trailing \x94 Windows-1252 end-quote)
    (b'\xc3\xa2\xe2\x82\xac\x94', b'\xe2\x80\x94'),
    # â€" → – (en-dash, trailing \x93 Windows-1252 start-quote)
    (b'\xc3\xa2\xe2\x82\xac\x93', b'\xe2\x80\x93'),
    # â€™ → ' (right single quote / apostrophe)
    (b'\xc3\xa2\xe2\x82\xac\xe2\x84\xa2', b'\xe2\x80\x99'),
    # Any remaining â€ prefix patterns → em-dash fallback
    (b'\xc3\xa2\xe2\x82\xac', b'\xe2\x80\x94'),
]

total_fixes = 0
for bad, good in replacements:
    count = content.count(bad)
    if count:
        content = content.replace(bad, good)
        print(f"  Fixed {count}x {bad!r} -> {good!r}")
        total_fixes += count

if total_fixes == 0:
    print("No garbled sequences found — file may already be clean.")
else:
    print(f"\nTotal fixes: {total_fixes}")

with open(TARGET, 'wb') as f:
    f.write(content)

print(f"Written {len(content)} bytes (was {original_len})")
print("Done.")
