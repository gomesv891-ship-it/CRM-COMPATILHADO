const fs = require('fs');
const path = require('path');

const SELLER_ID_MAP = {
  '5ebedc87-ef20-4abc-9613-7e8503c75c54': 'Vanessa Gomes',
  '9d86d050-72fb-49ed-8994-5b2681f559ff': 'Jhessica Camargo',
  '622d2e97-914d-4dc0-9327-a4a56b045744': 'Éder Perez',
};

const CATEGORIES = [
  { id: '0368b74c-2647-4e35-aeee-a3a5667561fd', name: 'PISOS VINÍLICOS' },
  { id: '83c3e2f0-dfa2-4e09-a233-ce0222b78d3b', name: 'MANTA HOSPITALAR' },
  { id: '49e104a4-8b26-4902-97cf-2394b3f4c27c', name: 'AUTONIVELANTES E MASSAS' },
  { id: '7aa1fd4b-f99d-48e0-9a76-f3ccacd2b2e8', name: 'PRIMERS' },
  { id: '6f8094a3-3698-4e50-adbf-f8d5a5262698', name: 'COLA PARA PISO VINÍLICO' },
  { id: '54ff2da7-1c77-458d-834e-77acaf3063f8', name: 'RODAPÉS POLIESTIRENO' },
  { id: '5359db09-6718-4c3d-908f-59317607d223', name: 'RODAPÉS MDF' },
  { id: '17e0cbc7-9c53-4284-ae38-a33e9d64cc18', name: 'COLA PARA RODAPÉ' },
  { id: '6f1a358c-63c6-4422-8066-d71e5938fbf3', name: 'RIPADO POLIESTIRENO' },
  { id: '839e7b87-10d8-40d4-8f51-9fd294252b42', name: 'RIPADO MDF' },
];
const catMap = new Map(CATEGORIES.map(c => [c.id, c.name]));

function formatPhone(phone) {
  if (!phone) return '';
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length === 11) {
    return '(' + digits.slice(0, 2) + ') ' + digits.slice(2, 7) + '-' + digits.slice(7);
  }
  if (digits.length === 10) {
    return '(' + digits.slice(0, 2) + ') ' + digits.slice(2, 6) + '-' + digits.slice(6);
  }
  return String(phone);
}

function mapClientType(typeStr) {
  if (!typeStr) return 'Cliente Final';
  const clean = typeStr.toUpperCase().replace(/_/g, ' ').trim();
  if (clean.includes('REVENDA')) return 'Revenda';
  if (clean.includes('CONSTRUTOR')) return 'Construtora';
  if (clean.includes('INSTALADOR')) return 'Instalador';
  if (clean.includes('ARQUITET')) return 'Arquiteto';
  if (clean.includes('ENGENHEIR')) return 'Engenheiro';
  if (clean.includes('DISTRIBUIDOR')) return 'Distribuidor';
  return 'Cliente Final';
}

// 1. Read Products
const prodPy = fs.readFileSync('scripts/data_produtos.py', 'utf-8');
const prodJson = prodPy.replace('PRODUTOS = ', '').replace(/True/g, 'true').replace(/False/g, 'false').replace(/None/g, 'null');
const rawProducts = JSON.parse(prodJson);

const productItems = rawProducts.map(p => {
  const cName = catMap.get(p.CATEGORIA_ID) || 'PISOS VINÍLICOS';
  const grpSlug = p.GRUPO ? ('grp_' + p.GRUPO.toLowerCase().replace(/[^a-z0-9]/g, '_')) : 'grp_geral';
  return {
    id: p.ID,
    name: p.NOME,
    categoryId: p.CATEGORIA_ID,
    categoryName: cName,
    groupId: grpSlug,
    groupName: p.GRUPO || 'GERAL',
    unit: p.UNIDADE || 'm²',
    priceClienteFinal: Number(p.PRECO_CLIENTE_FINAL) || 0,
    priceRevenda: Number(p.PRECO_REVENDA) || 0,
    priceConstrutora: Number(p.PRECO_CONSTRUTORA) || 0,
    price: Number(p.PRECO_CLIENTE_FINAL) || 0,
    active: p.ATIVO !== false,
  };
});

// Groups
const groupMap = new Map();
productItems.forEach(p => {
  if (!groupMap.has(p.groupId)) {
    groupMap.set(p.groupId, {
      id: p.groupId,
      name: p.groupName,
      categoryId: p.categoryId,
      color: '#0052cc',
    });
  }
});
const productGroups = Array.from(groupMap.values());

// 2. Read Part 1 Clients
const cliPy = fs.readFileSync('scripts/data_clientes_part1.py', 'utf-8');
const cliJson = cliPy.replace('CLIENTES_PART1 = ', '').replace(/True/g, 'true').replace(/False/g, 'false').replace(/None/g, 'null');
const rawClientsPart1 = JSON.parse(cliJson);

// 3. Read Existing Clients Seed
const seedContent = fs.readFileSync('src/data/initialClientsSeed.ts', 'utf-8');
const seedJsonText = seedContent
  .replace(/import .*/, '')
  .replace(/export const INITIAL_CLIENTS_DATASET: ClientRecord\[\] = /, '')
  .replace(/;\s*$/, '')
  .trim();
const existingClientsSeed = eval(seedJsonText);

const clientsList = [];
const p1Names = new Set();

rawClientsPart1.forEach(c => {
  const sellerId = c.VENDEDOR_ID || null;
  const registeredBy = sellerId && SELLER_ID_MAP[sellerId] ? SELLER_ID_MAP[sellerId] : 'Sem responsável';
  const normType = mapClientType(c.TIPO_CLIENTE);
  const dateStr = c.DATA_CRIACAO ? new Date(c.DATA_CRIACAO.replace(' ', 'T') + 'Z').toISOString() : new Date().toISOString();

  p1Names.add(c.NOME.trim().toLowerCase());
  clientsList.push({
    id: c.ID,
    name: c.NOME.trim(),
    clientType: normType,
    whatsapp: formatPhone(c.CONTATO),
    isImportant: Boolean(c.IMPORTANTE),
    notes: c.OBSERVACOES ? String(c.OBSERVACOES).trim() : '',
    registeredAt: dateStr,
    registeredBy,
    vendedorId: sellerId,
    status: c.STATUS && c.STATUS.toLowerCase() === 'inativo' ? 'inativo' : 'ativo',
  });
});

existingClientsSeed.forEach(s => {
  const key = s.name.trim().toLowerCase();
  if (!p1Names.has(key)) {
    clientsList.push({
      ...s,
      vendedorId: '5ebedc87-ef20-4abc-9613-7e8503c75c54',
      registeredBy: 'Vanessa Gomes',
    });
  }
});

console.log('Building TypeScript seed: ' + clientsList.length + ' clients, ' + productItems.length + ' products.');

const outputContent = `import { ClientRecord } from '../types';
import { ProductCategory, ProductGroup, GroupProductItem } from './initialProductsSeed';

export interface VendedorRecord {
  id: string;
  name: string;
  active: boolean;
}

export const OFFICIAL_VENDEDORES: VendedorRecord[] = [
  { id: '5ebedc87-ef20-4abc-9613-7e8503c75c54', name: 'Vanessa Gomes', active: true },
  { id: '9d86d050-72fb-49ed-8994-5b2681f559ff', name: 'Jhessica Camargo', active: true },
  { id: '622d2e97-914d-4dc0-9327-a4a56b045744', name: 'Éder Perez', active: true },
];

export const OFFICIAL_CATEGORIES: ProductCategory[] = ${JSON.stringify(CATEGORIES, null, 2)};

export const OFFICIAL_GROUPS: ProductGroup[] = ${JSON.stringify(productGroups, null, 2)};

export const OFFICIAL_PRODUCTS: GroupProductItem[] = ${JSON.stringify(productItems, null, 2)};

export const OFFICIAL_CLIENTS: ClientRecord[] = ${JSON.stringify(clientsList, null, 2)};
`;

fs.writeFileSync('src/data/databaseSeed.ts', outputContent, 'utf-8');
console.log('Wrote src/data/databaseSeed.ts successfully!');
