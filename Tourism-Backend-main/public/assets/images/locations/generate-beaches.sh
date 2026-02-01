#!/bin/bash
slugs=("sharm-el-sheikh" "hurghada" "ain-sokhna" "sahl-hasheesh" "makadi-bay" "marsa-alam" "el-gouna" "soma-bay" "taba" "nuweiba" "north-coast" "new-alamein" "marsa-matrouh" "dahab" "cairo" "port-said" "fayoum" "alexandria" "ismailia" "ras-el-bar" "siwa")
for i in {0..20}; do
  num=$(printf "%03d" $((i+2)))
  cp ../hotels/hotel-${num}.jpeg ${slugs[i]}.jpeg
  echo "Copied hotel-${num}.jpeg → ${slugs[i]}.jpeg"
done
echo "21 beach images ready!"
