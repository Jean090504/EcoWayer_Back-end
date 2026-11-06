const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const password = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{10,128}$/;

const cpf = (value) => {
    const digits = String(value || '').replace(/\D/g, '');
    if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits)) return false;

    const calculateDigit = (numbers, factor) => {
        let sum = 0;
        for (const digit of numbers) sum += Number(digit) * factor--;
        const result = (sum * 10) % 11;
        return result === 10 ? 0 : result;
    };

    return calculateDigit(digits.slice(0, 9), 10) === Number(digits[9])
        && calculateDigit(digits.slice(0, 10), 11) === Number(digits[10]);
};

const phone = (value) => /^\+?[0-9]{10,15}$/.test(String(value || '').replace(/[\s()-]/g, ''));

module.exports = { email, password, cpf, phone };
