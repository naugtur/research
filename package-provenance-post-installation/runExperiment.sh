#!/bin/bash

# Cleanup function
cleanup() {
    echo "Cleaning up previous test folders..."
    rm -rf npm-test yarn-test pnpm-test package.json
}


cleanup
mkdir -p npm-test yarn-test pnpm-test

cp package.json npm-test/
cp package.json yarn-test/
cp package.json pnpm-test/

# Configure package managers to skip lifecycle scripts
echo "ignore-scripts=true" > npm-test/.npmrc
echo "enableScripts: false" > yarn-test/.yarnrc.yml
echo "enable-pre-post-scripts=false" > pnpm-test/.npmrc

# Prepare sink
echo "Preparing sink..."
THEDIR=$(pwd)
cat > SINK < EOF
#!/bin/bash
echo "[$(date)] $@" >> "${THEDIR}/package-scripts.log"
zenity --warning --text="$@"
EOF
chmod +x SINK   

# make sure SINk is in the PATH
export PATH=$PATH:$(pwd)

# Install packages in each folder
echo "Installing with npm..."
cd npm-test
npm install
cd ..

echo "Installing with yarn..."
cd yarn-test
yarn install
cd ..

echo "Installing with pnpm..."
cd pnpm-test
pnpm install
cd ..

# Generate hashes
echo "Generating hashes..."
echo "# Package Installation Comparison" > comparison.md
echo "\`\`\`" >> comparison.md
echo "Generated on: $(date)" >> comparison.md
echo "" >> comparison.md

for manager in npm-test yarn-test pnpm-test; do
  echo "## $manager" >> comparison.md
  echo "### node_modules hash:" >> comparison.md
  find "$manager/node_modules" -type f -exec sha256sum {} \; | sort >> comparison.md
  echo "" >> comparison.md
  echo "### lockfile hash:" >> comparison.md
  if [ -f "$manager/package-lock.json" ]; then
    sha256sum "$manager/package-lock.json" >> comparison.md
  elif [ -f "$manager/yarn.lock" ]; then
    sha256sum "$manager/yarn.lock" >> comparison.md
  elif [ -f "$manager/pnpm-lock.yaml" ]; then
    sha256sum "$manager/pnpm-lock.yaml" >> comparison.md
  fi
  echo "" >> comparison.md
done

echo "\`\`\`" >> comparison.md
echo "Done! Check comparison.md for results."