# MyFluent Flow

Uma aplicação web progressiva para aprendizado de idiomas com uma trilha estruturada de 180 dias para alcançar fluência real.

## 🎯 Funcionalidades

- **Trilha de 180 dias**: 4 fases progressivas (Fundação → Aceleração → Fluência Operacional → Domínio)
- **Chat com IA**: Prática de conversação com correção gramatical em tempo real usando Groq API
- **Flashcards**: Sistema de vocabulário com spaced repetition e tradução automática
- **Sistema de XP e Streak**: Gamificação para manter a consistência
- **Tarefas diárias**: Rotina estruturada de vocabulário, speaking, listening e revisão
- **Múltiplos idiomas**: Inglês, Espanhol, Francês, Italiano, Alemão, Mandarim, Japonês
- **Modos de conversação**: Casual, Profissional e Correção
- **Armazenamento local**: Todos os dados salvos no dispositivo do usuário
- **Design mobile-first**: Interface otimizada para uso em smartphones

## 🚀 Tecnologias

- **TypeScript**: Type safety e melhor manutenção
- **Vite**: Build tool rápido e moderno
- **CSS puro**: Sem frameworks, performance otimizada
- **Groq API**: IA gratuita para conversação e tradução
- **LocalStorage**: Persistência de dados criptografada
- **Tabler Icons**: Ícones modernos e consistentes

## 📦 Instalação

### Pré-requisitos

- Node.js 18+ (recomendado) ou Node.js 17+ (compatível)
- npm 9+ ou yarn

### Passos

1. Clone o repositório:
```bash
git clone https://github.com/heltonsales1982/Myfluent.git
cd Myfluent
```

2. Instale as dependências:
```bash
npm install
```

3. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

4. Abra http://localhost:5173 no seu navegador

## 🔧 Configuração

### Chave API Groq

1. Acesse [console.groq.com](https://console.groq.com)
2. Crie uma conta gratuita
3. Vá em API Keys e crie uma nova chave
4. No app, vá em Config → cole sua chave API
5. A chave é salva criptografada no seu dispositivo

## 📱 Como Usar

### Tarefas Diárias

1. **Vocabulário (20 XP)**: Adicione 10 palavras novas na aba Vocab
2. **Speaking (20 XP)**: Converse pelo menos 8 mensagens na aba Conversar
3. **Listening (15 XP)**: Assista 15 min de conteúdo em 70% de compreensão
4. **Revisão (15 XP)**: Revise os flashcards na aba Vocab

### Trilha de Aprendizado

- **Fase 1 (Dias 1-30)**: Fundação - Top 300 palavras, fonética básica
- **Fase 2 (Dias 31-60)**: Aceleração - Top 1000 palavras, verbos no passado
- **Fase 3 (Dias 61-120)**: Fluência Operacional - 2000 palavras, gírias
- **Fase 4 (Dias 121-180)**: Domínio - 3000+ palavras, contexto profissional

## 🏗️ Estrutura do Projeto

```
Myfluent/
├── src/
│   ├── config/
│   │   └── constants.ts       # Constantes da aplicação
│   ├── modules/
│   │   ├── chat.ts            # Módulo de chat com IA
│   │   ├── vocab.ts           # Módulo de vocabulário
│   │   ├── progress.ts        # Módulo de progresso
│   │   └── ui.ts              # Módulo de interface
│   ├── utils/
│   │   ├── api.ts             # Utilitários de API
│   │   ├── storage.ts         # Storage criptografado
│   │   └── validation.ts      # Validação e sanitização
│   ├── app.ts                 # Entry point
│   ├── index.html             # HTML principal
│   └── styles.css             # Estilos
├── public/                    # Arquivos estáticos
├── assets/                    # Recursos
├── .gitignore
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## 🔒 Segurança

- API keys são criptografadas antes de salvar no localStorage
- Sanitização de inputs para prevenir XSS
- Validação de todos os dados de entrada
- Nenhum dado é enviado para servidores externos além da API Groq

## 🧪 Testes

```bash
npm run test
```

## 📦 Build para Produção

```bash
npm run build
```

Os arquivos otimizados serão gerados na pasta `dist/`.

## 🚀 Deploy

### Vercel

1. Conecte seu repositório ao Vercel
2. Configure as variáveis de ambiente se necessário
3. Deploy automático

### Netlify

1. Conecte seu repositório ao Netlify
2. Configure o comando de build: `npm run build`
3. Configure a pasta de publicação: `dist`

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 👨‍💻 Autor

**Helton Sales** - [GitHub](https://github.com/heltonsales1982)

## 🙏 Agradecimentos

- [Groq](https://groq.com) pela API gratuita de IA
- [Tabler Icons](https://tabler-icons.io) pelos ícones
- Comunidade de aprendizado de idiomas

---

**Nota**: Este é um projeto educacional. A fluência em idiomas requer prática consistente e imersão real além do uso desta ferramenta.