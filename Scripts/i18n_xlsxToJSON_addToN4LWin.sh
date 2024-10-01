#!/bin/bash
# WSL

userWin='nono_' 
userWSL=$(whoami) 

mv /mnt/c/Users/${userWin}/Downloads/i18n-n4l.xlsx /mnt/c/Users/${userWin}/i18n

i18n-json-to-xlsx-converter --convert /mnt/c/Users/${userWin}/i18n/i18n-n4l.xlsx

# remove ZWSP

sed 's/\xe2\x80\x8b//g' /mnt/c/Users/${userWin}/i18n/es.json > /mnt/c/Users/${userWin}/i18n/es_clear.json

sed 's/\xe2\x80\x8b//g' /mnt/c/Users/${userWin}/i18n/en.json > /mnt/c/Users/${userWin}/i18n/en_clear.json

mv /mnt/c/Users/${userWin}/i18n/es_clear.json /home/${userWSL}/Projects/nets4learning/public/locales/es/translation.json

mv /mnt/c/Users/${userWin}/i18n/en_clear.json /home/${userWSL}/Projects/nets4learning/public/locales/en/translation.json
