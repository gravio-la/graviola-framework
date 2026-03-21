#!/usr/bin/env bash
#
# Import RDF triples into an Oxigraph (or Graph Store protocol) endpoint.
# Uses SPARQL 1.1 Graph Store HTTP Protocol: PUT replaces the default graph,
# POST appends. Oxigraph accepts ?default for the default graph and
# no_transaction=1 to avoid heavy transaction memory use.

#default values
endpoint_url="http://localhost:7878/store"
input_file="dump.nt"
format_mime="application/n-triples"
method="POST"   # PUT = replace default graph, POST = add to default graph

function help {
    echo "Usage: $0 [-e endpoint-url] [-i input-file] [-f format-mime] [-m method]"
    echo "  -e endpoint-url  The URL of the store endpoint. Default: http://localhost:7878/store"
    echo "  -i input-file   The file to read the triples from. Default: dump.nt"
    echo "  -f format-mime  The MIME type of the input file. Default: application/n-triples"
    echo "                  Use text/turtle for .ttl files."
    echo "  -m method       PUT (replace default graph) or POST (append). Default: POST"
    echo "  -h              Show this help message"
    exit 0
}

#parse options
while getopts "e:i:f:m:h" opt; do
    case ${opt} in
        e ) endpoint_url=$OPTARG;;
        i ) input_file=$OPTARG;;
        f ) format_mime=$OPTARG;;
        m ) method=$OPTARG;;
        h ) help;;
        \? ) help;;
    esac
done

# Oxigraph: ?default = default graph, no_transaction=1 = avoid heavy transaction memory
curl -f -X "${method}" -H "Content-Type: ${format_mime}" -T "${input_file}" "${endpoint_url}?default&no_transaction=1"