import json
import os

# 1. VENDEDORES
VENDEDORES = [
  {
    "ID": "5ebedc87-ef20-4abc-9613-7e8503c75c54",
    "NOME": "Vanessa Gomes",
    "ATIVO": True
  },
  {
    "ID": "9d86d050-72fb-49ed-8994-5b2681f559ff",
    "NOME": "Jhessica Camargo",
    "ATIVO": True
  },
  {
    "ID": "622d2e97-914d-4dc0-9327-a4a56b045744",
    "NOME": "Éder Perez",
    "ATIVO": True
  }
]

with open("scripts/vendedores.json", "w", encoding="utf-8") as f:
    json.dump(VENDEDORES, f, ensure_ascii=False, indent=2)

print("Vendedores saved:", len(VENDEDORES))
