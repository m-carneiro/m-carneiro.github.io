# Matheus Carneiro — currículo e portfólio

Site estático em português e inglês. O visual do currículo é preservado, e os projetos são escritos em Markdown. O build converte os arquivos em destaques, catálogo e páginas completas. Não há chamadas ao GitHub durante a visita.

## Publicação

GitHub Pages: https://m-carneiro.github.io/matheus-portfolio/

O workflow `.github/workflows/pages.yml` testa, gera e publica o site a cada commit em `main`. Pull requests executam as mesmas verificações sem publicar. No GitHub, a fonte em **Settings → Pages → Build and deployment → Source** deve estar em **GitHub Actions**.

## Adicionar um projeto pelo GitHub

1. Abra `projects/_template/pt.md` e copie o conteúdo.
2. Use **Add file → Create new file** para criar `projects/nome-do-projeto/pt.md`. Use letras minúsculas, números e hífens no nome da pasta. Mantenha `draft: true` enquanto escreve.
3. Copie também `projects/_template/en.md` para `projects/nome-do-projeto/en.md` e escreva a tradução.
4. Preencha título, resumo e tecnologias em cada idioma. No arquivo **pt.md**, escolha `featured: true` para aparecer na página inicial e ajuste `order` (menor número aparece primeiro).
5. Quando as duas versões estiverem prontas, altere **apenas em pt.md** `draft: true` para `draft: false` e salve em `main`.
6. Acompanhe **Actions → Build and publish portfolio**. Após a publicação terminar, o projeto estará no site.

A pasta `_template` não é publicada. Rascunhos não geram páginas, cartões nem cópias dos seus arquivos no site. Os arquivos Markdown e rascunhos continuam visíveis no repositório público: não coloque informações confidenciais neles.

Se não houver projetos publicados, a página inicial permanece como o currículo atual. A seção de projetos aparece automaticamente quando o primeiro projeto é publicado. Todos os publicados aparecem no catálogo; `featured` controla os destaques da página inicial.

## Campos do Markdown

**pt.md** controla a publicação e a organização:

```yaml
---
title: "Nome do projeto"
summary: "Uma frase explicando o problema e a solução."
tags: ["AppSec", "AI Security"]
draft: true
featured: true
order: 1
# cover: "cover.png"
---
```

**en.md** contém os campos traduzidos:

```yaml
---
title: "Project name"
summary: "One sentence explaining the problem and the solution."
tags: ["AppSec", "AI Security"]
---
```

Abaixo dos metadados, escreva com Markdown normal: títulos, listas, links, imagens, tabelas e blocos de código. O HTML é filtrado antes da publicação.

## Imagens e anexos

Coloque imagens PNG, JPG, WebP ou GIF e anexos PDF dentro da pasta do projeto. Use caminhos relativos, por exemplo:

```markdown
![Diagrama da arquitetura](diagrama.png)
[Apresentação](apresentacao.pdf)
```

Para uma capa, descomente `cover: "cover.png"` em `pt.md`. A imagem é compartilhada pelos dois idiomas. Os arquivos devem ficar na pasta do projeto; não use `../` para capas.

## Trabalhar localmente

Requer Node.js 22 ou superior.

```bash
npm ci
npm run new:project -- meu-projeto
npm test
npm run build
npm run preview
```

Abra o endereço indicado pelo preview. O resultado em `dist/` também funciona abrindo `index.html` diretamente. `?lang=en` abre qualquer página em inglês. O seletor PT/EN mantém sua preferência no navegador.

## Estrutura

```text
projects/
  _template/       # modelo não publicado
    pt.md
    en.md
  meu-projeto/
    pt.md         # publicação, destaque e ordem + texto em português
    en.md         # texto em inglês
    cover.png     # opcional
scripts/          # geração, validação e preview
templates/home.html # currículo e traduções
public/           # PDF do CV e arquivos compartilhados
tests/            # verificações de conteúdo e geração
.github/workflows/pages.yml # publicação automática
```

Para editar o currículo, altere `templates/home.html`; para substituir o CV, atualize `public/cv-matheus-carneiro.pdf`.
