npm run build
echo "Compressing..."
tar -zcf dist.tar.gz dist package.json package-lock.json
echo "Sending..."
scp dist.tar.gz kramster:kramster-api/
echo "Running server prod deploy script"
ssh -t kramster './deploy-kramster-api.sh'
