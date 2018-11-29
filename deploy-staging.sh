npm run build
echo "Compressing..."
tar -zcf dist.tar.gz dist package.json package-lock.json
echo "Sending..."
scp dist.tar.gz kramster:kramster-api-staging/
echo "Running server staging deploy script"
ssh -t kramster './deploy-kramster-api-staging.sh'
