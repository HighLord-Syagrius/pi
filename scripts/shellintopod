echo " "
echo " "
echo "Shelling into the first pod like the absolute gangsters that we are."
echo "...."
echo "    Is there a less volitile way to do this?"
echo "                                             ..."
echo "            ======================= "
echo "              !!!!!!  YES  !!!!!"
echo "            ======================= "
echo " "
echo " But we're doing it this way anyway because I want to."
echo " " 
echo " "

function doIt() {
  kubectl exec --stdin --tty $(kubectl get pods --no-headers | head -n 1 | awk '{print $1}') -- /bin/bash
}
doIt
