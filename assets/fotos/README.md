# Fotos dos trabalhos em destaque

Substitua os placeholders (picsum.photos) pelos arquivos reais usando os nomes abaixo.
Formato recomendado: **JPG**, proporção **4:3** (ex.: 1200x900), até ~300 KB.

## Arquivos esperados

| Slug                 | Trabalho                              | Ano       |
| -------------------- | ------------------------------------- | --------- |
| `menino-pipa.jpg`    | O menino da pipa avoada               | 2025      |
| `homem-cachorro.jpg` | O homem do cachorro                   | 2022      |
| `3-e-par.jpg`        | 3 é Par (websérie)                    | 2019–23   |
| `ponciano.jpg`       | Ponciano — De Amores — Furtado        | 2025      |
| `james-holmes.jpg`   | Eu me chamo James Holmes              | 2019      |
| `magico-de-oz.jpg`   | O Mágico de Oz                        | 2019      |
| `saltimbancos.jpg`   | Os Saltimbancos                       | 2018      |
| `sonhos-verao.jpg`   | Sonhos de uma noite de verão          | 2017      |

## Como trocar

No `index.html`, procure por `picsum.photos/seed/<slug>` e substitua pelo caminho local:

```html
<!-- antes -->
<div class="destaques__photo" style="background-image:url('https://picsum.photos/seed/menino-pipa-avoada/800/560')"></div>

<!-- depois -->
<div class="destaques__photo" style="background-image:url('assets/fotos/menino-pipa.jpg')"></div>
```

## Imagem de fundo do hero

A imagem de fundo do hero está em `css/styles.css`, regra `.hero__bg`. Arquivo sugerido: `assets/fotos/hero-bg.jpg` (1920x1200 ou maior, formato atmosférico/cinematográfico — retrato, palco, luz de teatro, etc.). Para trocar, altere:

```css
.hero__bg {
  background-image: url('../assets/fotos/hero-bg.jpg');
}
```

O overlay escuro já é aplicado automaticamente, então a imagem pode ter qualquer iluminação.
