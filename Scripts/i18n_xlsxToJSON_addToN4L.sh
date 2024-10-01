#!/bin/bash
# WSL

user=$(whoami) 

mv /mnt/c/Users/${user}/Downloads/i18n-n4l.xlsx /mnt/c/Users/${user}/i18n

i18n-json-to-xlsx-converter --convert /mnt/c/Users/${user}/i18n/i18n-n4l.xlsx

# remove ZWSP

sed 's/\xe2\x80\x8b//g' /mnt/c/Users/${user}/i18n/es.json > /mnt/c/Users/${user}/i18n/es_clear.json

sed 's/\xe2\x80\x8b//g' /mnt/c/Users/${user}/i18n/en.json > /mnt/c/Users/${user}/i18n/en_clear.json

mv /mnt/c/Users/${user}/i18n/es_clear.json /home/${user}/WebstormProjects/nets4learning/public/locales/es/translation.json

mv /mnt/c/Users/${user}/i18n/en_clear.json /home/${user}/WebstormProjects/nets4learning/public/locales/en/translation.json
