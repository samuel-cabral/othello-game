#!/bin/bash

# Obtendo o IP da interface de rede
echo "🔍 Procurando seu endereço IP da rede local..."
IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -n 1)
echo "✅ Seu endereço IP da rede local: $IP"

# Atualiza o arquivo .env com este IP automaticamente
echo ""
echo "📝 Atualizando .env.local com seu IP de rede..."
sed -i.bak -e "s|http://SEU_IP_LOCAL:3001|http://$IP:3001|g" -e "s|http://localhost:3001|http://$IP:3001|g" apps/web/.env.local
echo "✅ Arquivo apps/web/.env.local atualizado com: http://$IP:3001"

echo ""
echo "📱 Para testes em múltiplos dispositivos:"
echo "   - Endereço do Servidor: http://$IP:3001"
echo "   - Cliente Web (Computador): http://localhost:3000"
echo "   - Cliente Web (Celular): http://$IP:3000"
echo ""

# Inicia o servidor em segundo plano
echo "🚀 Iniciando o servidor..."
cd apps/server
npm run dev &
SERVER_PID=$!
cd ../..

# Aguarda o servidor iniciar
echo "⏳ Aguardando o servidor iniciar..."
sleep 5

# Inicia o cliente web
echo "🚀 Iniciando o cliente web..."
cd apps/web
npm run dev

# Quando o cliente for interrompido com Ctrl+C, também para o servidor
trap "echo '🛑 Parando o servidor...'; kill $SERVER_PID" EXIT

# Aguarda o cliente encerrar
wait 