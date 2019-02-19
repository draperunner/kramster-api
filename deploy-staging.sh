npm run build
echo "Compressing..."
tar -zcf dist.tar.gz dist package.json package-lock.json
echo "Sending..."
scp dist.tar.gz byrkje:kramster-api-staging/
echo "Running server staging deploy script"
ssh -t byrkje './deploy-kramster-api-staging.sh'
