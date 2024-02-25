import * as yup from 'yup';

export const firstFormSchema = yup.object().shape({
  firstName: yup
    .string()
    .min(3, 'Name must be at least 3 characters')
    .required('First Name is required'),
  dob: yup
    .mixed()
    .test(
      'is-positive-integer',
      'Age must be a positive integer',
      function (value: any) {
        if (!value) return false; // Allow empty value
        const parsedValue = parseInt(value, 10);
        return Number.isInteger(parsedValue) && parsedValue > 0;
      }
    )
    .required('Date of Birth or Age is required'),
  sex: yup.string().required('Required, Oneof Male, Female'),
  mobile: yup
    .string()
    .matches(/^[6-9]\d{9}$/, 'Enter a valid Indian mobile number')
    .required('Mobile number is required'),
  idType: yup.string().required('ID Type is required'),
  id: yup.string().when('idType', (idType, schema) => {
    const type = idType as any; // Explicitly declare type

    if (type[0] === 'aadhar') {
      return schema
        .matches(
          /^[2-9]\d{11}$/,
          'Enter a valid Aadhar number (12 numeric digits, not starting with 0 or 1)'
        )
        .required('Aadhar number is required');
    } else {
      return schema
        .matches(
          /^[A-Za-z0-9]{10}$/,
          'Enter a valid PAN number (10 alphanumeric characters)'
        )
        .required('PAN number is required');
    }
  }),
});

export const secondFormSchema = yup.object().shape({
  address: yup.string(),
  state: yup.string(),
  city: yup.string(),
  country: yup.string(),
  pinCode: yup.number(),
});
