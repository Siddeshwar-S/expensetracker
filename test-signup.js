// Test signup endpoint
async function testSignup() {
    console.log('Testing signup endpoint...\n');

    try {
        const response = await fetch('http://localhost:4000/api/auth/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: 'test@example.com',
                password: 'test123456',
                fullName: 'Test User'
            })
        });

        console.log('Status:', response.status, response.statusText);

        const data = await response.json();
        console.log('Response:', JSON.stringify(data, null, 2));

        if (response.ok) {
            console.log('\n✅ Signup successful!');
            console.log('📧 Check your backend terminal for the verification email box');
        } else {
            console.log('\n❌ Signup failed');
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.log('\n⚠️  Make sure backend is running: cd backend && npm run dev');
    }
}

testSignup();
