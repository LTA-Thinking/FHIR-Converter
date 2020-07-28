Lightweight clone of the [FHIR Converter](https://github.com/microsoft/FHIR-Converter) designed to be used through Azure Functions.

Two function endpoints:
    FhirConverter: API. Convert Hl7v2 or CDA data to FHIR.
    UploadData: Website. Convert CCD data to FHIR through a file upload.

Only supports converting against known templates. 
Body format for the FhirConverter is:
```
{
    "srcDataBase64": base 64 encoded string (the data to convert),
}
```