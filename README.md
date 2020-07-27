Lightweight clone of the [FHIR Converter](https://github.com/microsoft/FHIR-Converter) designed to be used through Azure Functions.

Has no files stored locally, all templates and data used have to be passed in.
Body format is:
```
{
    "srcDataType": string ("hl7v2" or "cda"),
    "srcDataBase64": base 64 encoded string (the data to convert),
    "templateBase64": base 64 encoded string (the top level template),
    "templatesOverrideBase64": base 64 encoded string (the partial templates used)
}
```