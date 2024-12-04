const {
    getAllUsers,
    getUserByEmail,
    getAllContent,
    getContentByUserEmail,
    getDatabaseStats
} = require('../db');

async function viewAllData() {
    try {
        console.log('\n=== Database Overview ===');
        await getDatabaseStats();

        console.log('\n=== All Users ===');
        await getAllUsers();

        console.log('\n=== All Content ===');
        await getAllContent();

    } catch (error) {
        console.error('Error viewing data:', error);
    } finally {
        process.exit(0);
    }
}

async function viewUserData(email) {
    try {
        console.log(`\n=== Data for user: ${email} ===`);
        const user = await getUserByEmail(email);
        if (user) {
            await getContentByUserEmail(email);
        }
    } catch (error) {
        console.error('Error viewing user data:', error);
    } finally {
        process.exit(0);
    }
}

const email = process.argv[2];
if (email) {
    viewUserData(email);
} else {
    viewAllData();
}
