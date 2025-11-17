#!/bin/bash
# Setup GOV.UK Frontend assets and custom images for local development
set -e

# Create required asset directories
mkdir -p public/govuk/assets/stylesheets
mkdir -p public/govuk/assets/fonts
mkdir -p public/govuk/assets/images
mkdir -p public/images

# Copy GOV.UK Frontend CSS
cp node_modules/govuk-frontend/dist/govuk/govuk-frontend.min.css public/govuk/assets/stylesheets/

# Copy GOV.UK Frontend fonts and images
cp -r node_modules/govuk-frontend/dist/govuk/assets/fonts/* public/govuk/assets/fonts/
cp -r node_modules/govuk-frontend/dist/govuk/assets/images/* public/govuk/assets/images/

# Copy custom logo if present
if [ -f assets/2i-labs-logo-nobackground.png ]; then
  cp assets/2i-labs-logo-nobackground.png public/images/
else
  echo "Warning: assets/2i-labs-logo-nobackground.png not found. Please add your logo to the assets directory."
fi

echo "GOV.UK Frontend assets and logo setup complete."
